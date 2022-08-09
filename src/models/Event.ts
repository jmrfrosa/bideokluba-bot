import { WithId } from 'mongodb'
import {
  ColorResolvable,
  Message,
  EmbedBuilder,
  ButtonInteraction,
  ModalBuilder,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  PermissionsBitField,
  GuildMember,
} from 'discord.js'
import {
  EventDocumentType,
  EventInterface,
  EventListValues,
  EventOptionKeys,
} from '@typings/event.type'
import { fetchMessage, fetchChannel, fetchUser } from '@util/common'
import { toDate } from '@util/datetime'
import { gCalUrl } from '@util/events'
import { logger } from '@util/logger'
import { Week } from './Week'
import { dbInstance } from '../service/DbService'
import { entityCache } from '../service/CacheService'
import { WeekDocumentType } from '../typings/week.type'
import { CacheNames } from '../typings/enums'

export class Event implements EventInterface {
  static readonly collectionName = 'events'
  static readonly embedColor: ColorResolvable = [243, 67, 64] as const
  static readonly options = {
    '✅': '✅ vou',
    '❌': '❌ não vou',
    '🤷‍♂️': '🤷‍♂️ talvez',
    '🗑': 'remover',
    '✏️': 'editar',
  } as const
  static readonly removalOption = '🗑' as const
  static readonly editOption = '✏️' as const
  static readonly model = dbInstance.db.collection<EventDocumentType>(this.collectionName)

  public title
  public date
  public owner
  public author
  public active = true
  public channel
  public message
  public week
  public attendance

  constructor({
    channel,
    title,
    date,
    owner,
    author,
    message = null,
    attendance = null,
    active = true,
    week = null,
  }: EventInterface) {
    this.title = title
    this.date = date
    this.owner = owner
    this.author = author
    this.active = active
    this.channel = channel
    this.message = message
    this.week = week

    const { [Event.removalOption]: _remove, [Event.editOption]: _edit, ...states } = Event.options

    this.attendance = attendance || new Map(Object.values(states).map((s) => [s, new Set()]))
  }

  static async fetch(searchParams: Partial<WithId<EventDocumentType>>) {
    const query = Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => !!v))

    if (!Object.keys(query).length) return

    const event = await this.model.findOne({
      ...query,
    })

    if (!event) {
      logger.error('Something went wrong. Event for query %o was not found.', query)
      return
    }

    return Event.hydrate(event)
  }

  static async hydrate(dbObj: WithId<EventDocumentType>, parentWeek?: Week) {
    const channel = await fetchChannel({ id: dbObj.channel, fromCache: false })

    if (!channel) {
      logger.error(`Channel ${dbObj.channel} from ${dbObj._id} was not found`)
      return
    }

    const message = await fetchMessage({
      id: dbObj.message,
      channel,
      fromCache: false,
    })

    const {
      title,
      date,
      owner,
      author,
      attendance,
      week: weekId,
      active,
    } = await Event.deserialize(dbObj)

    const week = parentWeek ? parentWeek : await entityCache.find(weekId, CacheNames.Weeks)

    if (!week) {
      logger.error('Could not find week %o for event %o', weekId, dbObj.message)
      return
    }

    return new Event({
      message,
      channel,
      title,
      date,
      owner,
      author,
      attendance,
      active,
      week,
    })
  }

  async save(message: Message) {
    this.message = message

    await this.addToWeek()
    const serializedEvent = this.serialize()

    if (!serializedEvent) {
      logger.error('Something went wrong while serializing event: %o', this)
      return
    }

    const event = await Event.model.insertOne(serializedEvent)
    entityCache.events.set(message.id, this)

    logger.info('Event was saved into database: %o', event)

    return event
  }

  async addToWeek() {
    const eventDate = this.date.toDate()
    const eligibleWeek = await Week.model.findOne<WithId<WeekDocumentType>>({
      weekStart: { $lte: eventDate },
      weekEnd: { $gte: eventDate },
    })

    const week =
      (await entityCache.find(eligibleWeek?.message, CacheNames.Weeks)) ||
      (await Week.create({ date: this.date }))

    if (!week) {
      logger.error('Error finding or creating week: %o', this)
      return
    }

    this.week = week
    await week.addEvent(this)

    // Re-render message to update Week link
    await this.message?.edit({ embeds: [this.render()] })
  }

  async archive() {
    this.active = false
    const id = this.message?.id

    if (!id) return

    entityCache.events.delete(id)

    return await Event.model.updateOne({ message: id }, { $set: { active: false } })
  }

  async unarchive() {
    this.active = true
    const id = this.message?.id

    if (!id) return

    entityCache.events.set(id, this)

    return await Event.model.updateOne({ message: id }, { $set: { active: true } })
  }

  async updateUser({ member, state }: { member: GuildMember; state: EventListValues }) {
    const name = member.displayName

    for (const [listName, attendees] of this.attendance) {
      listName === state && !attendees.has(name) ? attendees.add(name) : attendees.delete(name)
    }

    await this.message?.edit({ embeds: [this.render()] })

    await Event.model.updateOne(
      { message: this.message?.id },
      { $set: { attendance: this.serializeAttendance() } },
    )
  }

  async remove() {
    if (!this.message || typeof this.week === 'string') return

    entityCache.events?.delete(this.message.id)

    this.week?.removeEvent(this)

    await Event.model.deleteOne({ message: this.message.id }, {})
    await this.message.delete()
  }

  render() {
    const weekUrl = typeof this.week === 'string' ? undefined : this?.week?.message?.url
    const calendarField = {
      name: 'Links',
      value: `[Adicionar ao Google Calendar](${gCalUrl(this)})`,
      inline: false,
    }
    const attendance = Array.from(this.attendance.entries(), ([state, attendees]) => {
      const value = attendees.size > 0 ? this.formatAttendees([...attendees]) : '> -'

      return { name: state, value, inline: true }
    })
    const fields = [calendarField, ...attendance]

    return new EmbedBuilder()
      .setAuthor({ name: '⤴️ Ver semana', url: weekUrl })
      .setThumbnail('https://icons-for-free.com/iconfiles/png/512/calendar-131964752454737242.png')
      .setColor(Event.embedColor)
      .setTitle(this.title)
      .setDescription(this.date.format('dddd, DD/MM'))
      .addFields(...fields)
      .setFooter({ text: `Adicionado por ${this.author}` })
  }

  serialize() {
    if (
      !this.week ||
      typeof this.week === 'string' ||
      !this.week.message?.id ||
      !this.message ||
      typeof this.message === 'string'
    ) {
      logger.error('Error while serializing event, properties are not properly hydrated: %o', this)
      return
    }

    const attendance = this.serializeAttendance()

    return {
      message: this.message.id,
      channel: this.message.channel.id,
      title: this.title,
      date: this.date.toDate(),
      owner: this.owner?.id,
      author: this.author,
      attendance,
      week: this.week.message.id,
      active: this.active,
    }
  }

  static async deserialize(data: EventDocumentType) {
    const attendance = new Map(Object.entries(data.attendance).map(([k, v]) => [k, new Set(v)]))

    return {
      title: data.title,
      date: toDate(data.date.toISOString()),
      owner: data.owner ? await fetchUser({ id: data.owner }) : null,
      author: data.author,
      attendance,
      week: data.week,
      active: data.active,
    }
  }

  async handleOptionChoice(interaction: ButtonInteraction) {
    if (!interaction.inCachedGuild()) return

    logger.trace(
      'InteractionHandler#handleButton: button interaction received: %o',
      interaction.customId,
    )

    const { user, member, customId } = interaction
    const [optionId, messageId] = customId.split('-')
    const state = Event.options[optionId as EventOptionKeys]

    if (!state) {
      logger.error(
        'InteractionHandler#handleButton: Event button interaction %o did not match a known state',
        interaction.customId,
      )
      return
    }

    const userIsOwner = this.owner?.id === user.id
    const userIsModerator = (member?.permissions as Readonly<PermissionsBitField>)?.has(
      PermissionsBitField.Flags.ManageMessages,
    )
    const hasPermissions = userIsOwner || userIsModerator

    switch (state) {
      case Event.options[Event.editOption]:
        hasPermissions
          ? await this.handleEditInteraction(interaction, messageId)
          : await interaction.reply({
              content: 'Não tens permissão para editar este evento!',
              ephemeral: true,
            })
        break
      case Event.options[Event.removalOption]:
        hasPermissions
          ? await this.handleRemoveInteraction(interaction)
          : await interaction.reply({
              content: 'Não tens permissão para remover este evento!',
              ephemeral: true,
            })
        break
      default:
        await interaction.deferUpdate()

        this.updateUser({ member, state })
        break
    }
  }

  private async handleEditInteraction(interaction: ButtonInteraction, modalId: string) {
    logger.trace('Building modal for interaction: %o', interaction.customId)
    const modal = this.buildEditModal(modalId)

    await interaction.showModal(modal)
  }

  private async handleRemoveInteraction(interaction: ButtonInteraction) {
    logger.trace('Removing event: %o', this.message?.id)

    await interaction.deferUpdate()
    await this.remove()
  }

  async handleModalSubmission(interaction: ModalSubmitInteraction) {
    if (!interaction.isFromMessage()) return

    const { customId } = interaction

    const newTitle = interaction.fields.getTextInputValue(`titleInput-${customId}`)
    const newDate = interaction.fields.getTextInputValue(`dateInput-${customId}`)

    this.title = newTitle
    this.date = toDate(newDate)
    await (this.week as Week).removeEvent(this)
    await this.addToWeek()

    await Event.model.updateOne(
      { message: this.message?.id },
      { $set: { title: newTitle, date: toDate(newDate).toDate() } },
    )

    await interaction.message.edit({ embeds: [this.render()] })
  }

  private buildEditModal(messageId: string) {
    const modalId = `editModal-${messageId}`
    const modal = new ModalBuilder().setCustomId(modalId).setTitle(`Editar ${this.title}`)

    const titleInput = new TextInputBuilder()
      .setCustomId(`titleInput-${modalId}`)
      .setLabel('Título do evento')
      .setStyle(TextInputStyle.Short)
      .setValue(this.title)

    const dateInput = new TextInputBuilder()
      .setCustomId(`dateInput-${modalId}`)
      .setLabel('Data, formato DD/MM ou DD/MM/YYYY')
      .setStyle(TextInputStyle.Short)
      .setValue(this.date.format('DD/MM/YYYY'))

    const editTitleRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      titleInput,
    )
    const editDateRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      dateInput,
    )

    modal.addComponents(editTitleRow, editDateRow)

    return modal
  }

  private serializeAttendance() {
    return Object.fromEntries(
      Array.from(this.attendance.entries(), ([state, attendees]) => [state, [...attendees]]),
    )
  }

  private formatAttendees(usernames: string[]) {
    return usernames.map((u) => `> ${u}`).join('\n')
  }
}
