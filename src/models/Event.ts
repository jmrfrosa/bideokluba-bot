import {
  ColorResolvable,
  Message,
  EmbedBuilder,
  User,
  ButtonInteraction,
} from 'discord.js'
import {
  EventDocumentType,
  EventInterface,
  EventOptionKeys,
  EventOptionValues,
} from '@typings/event.type'
import { client } from '@util/client'
import { fetchMessage, fetchChannel, fetchMember } from '@util/common'
import { db } from '@util/database'
import { toDate } from '@util/datetime'
import { gCalUrl } from '@util/events'
import { logger } from '@util/logger'
import { Week } from './Week'

export class Event implements EventInterface {
  static readonly modelType = 'event' as const
  static readonly embedColor: ColorResolvable = [243, 67, 64] as const
  static readonly options = {
    '✅': '✅ vou',
    '❌': '❌ não vou',
    '🤷‍♂️': '🤷‍♂️ talvez',
    '🗑': 'remover',
  } as const
  static readonly removalOption = '🗑' as const

  public title
  public date
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
    author,
    message = null,
    attendance = null,
    active = true,
    week = null,
  }: EventInterface) {
    this.title = title
    this.date = date
    this.author = author
    this.active = active
    this.channel = channel
    this.message = message
    this.week = week

    const { [Event.removalOption]: _, ...states } = Event.options

    this.attendance =
      attendance || new Map(Object.values(states).map((s) => [s, new Set()]))
  }

  static async fetch(searchParams: Partial<EventDocumentType>) {
    const query = Object.fromEntries(
      Object.entries(searchParams).filter(([_, v]) => !!v),
    )

    if (!Object.keys(query).length) return

    const event: EventDocumentType = await db.findOne({
      model: Event.modelType,
      ...query,
    })

    return Event.hydrate(event)
  }

  static async hydrate(dbObj: EventDocumentType) {
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

    const { title, date, author, attendance, week, active } =
      Event.deserialize(dbObj)

    return new Event({
      message,
      channel,
      title,
      date,
      author,
      attendance,
      week,
      active,
    })
  }

  async save(message: Message) {
    this.message = message

    await this.addToWeek()
    const event = await db.insert(this.serialize())
    client.events?.set(message.id, this)

    logger.info('Event was saved into database: %o', event)

    return event
  }

  async addToWeek() {
    const week =
      client.calendarWeeks?.find((w) =>
        this.date.isBetween(w.weekStart, w.weekEnd, null, '[]'),
      ) || (await Week.create({ date: this.date }))

    if (!week) {
      logger.error('Error finding or creating week: %o', this)
      return
    }

    this.week = week as Week
    week.addEvent(this)

    // Re-render message to update Week link
    await this.message?.edit({ embeds: [this.render()] })
  }

  async archive() {
    this.active = false
    const id = this.message?.id

    if (!id) return

    client.events?.delete(id)

    return await db.update(
      { model: Event.modelType, message: id },
      { $set: { active: false } },
    )
  }

  async unarchive() {
    this.active = true
    const id = this.message?.id

    if (!id) return

    client.events?.set(id, this)

    return await db.update(
      { model: Event.modelType, message: id },
      { $set: { active: true } },
    )
  }

  async updateUser({ user, state }: { user: User; state: EventOptionValues }) {
    const member = await fetchMember({
      guild: this.message?.guild,
      username: user.username,
    })
    const name = member?.displayName

    if (!name) {
      logger.error(`Could not find member for user %o`, user)
      return
    }

    if (state === Event.options[Event.removalOption]) return await this.remove()

    for (const [list, attendees] of this.attendance) {
      list === state ? attendees.add(name) : attendees.delete(name)
    }

    await this.message?.edit({ embeds: [this.render()] })

    await db.update(
      { model: Event.modelType, message: this.message?.id },
      { $set: { attendance: this.serializeAttendance() } },
    )
  }

  async remove() {
    if (!this.message || typeof this.week === 'string') return

    client.events?.delete(this.message.id)

    this.week?.removeEvent(this)

    await db.remove({ model: Event.modelType, message: this.message.id }, {})
    await this.message.delete()
  }

  render() {
    const weekUrl =
      typeof this.week === 'string' ? undefined : this?.week?.message?.url
    const calendarField = {
      name: 'Links',
      value: `[Adicionar ao Google Calendar](${gCalUrl(this)})`,
      inline: false,
    }
    const attendance = Array.from(
      this.attendance.entries(),
      ([state, attendees]) => {
        const value =
          attendees.size > 0 ? this.formatAttendees([...attendees]) : '> -'

        return { name: state, value, inline: true }
      },
    )
    const fields = [calendarField, ...attendance]

    return new EmbedBuilder()
      .setAuthor({ name: '⤴️ Ver semana', url: weekUrl })
      .setThumbnail(
        'https://icons-for-free.com/iconfiles/png/512/calendar-131964752454737242.png',
      )
      .setColor(Event.embedColor)
      .setTitle(this.title)
      .setDescription(this.date.format('dddd, DD/MM'))
      .addFields(...fields)
      .setFooter({ text: `Adicionado por ${this.author}` })
  }

  serialize() {
    if (typeof this.week === 'string') return

    const attendance = this.serializeAttendance()

    return {
      model: Event.modelType,
      message: this.message?.id,
      channel: this.message?.channel?.id,
      title: this.title,
      date: this.date.format('DD/MM/YYYY'),
      author: this.author,
      attendance,
      week: this.week?.message?.id,
      active: this.active,
    }
  }

  static deserialize(data: EventDocumentType) {
    const attendance = new Map(
      Object.entries(data.attendance).map(([k, v]) => [k, new Set(v)]),
    )

    return {
      model: Event.modelType,
      title: data.title,
      date: toDate(data.date),
      author: data.author,
      attendance,
      week: data.week,
      active: data.active,
    }
  }

  async handleOptionChoice(interaction: ButtonInteraction) {
    const { user, customId } = interaction
    const optionId = customId.split('-')[0] as EventOptionKeys
    const state = Event.options[optionId]

    if (!state) {
      logger.error(
        'InteractionHandler#handleButton: Event button interaction received for unknown state: %o | Event options: %o',
        interaction.customId,
      )
      return
    }

    this.updateUser({ user, state })
  }

  private serializeAttendance() {
    return Object.fromEntries(
      Array.from(this.attendance.entries(), ([state, attendees]) => [
        state,
        [...attendees],
      ]),
    )
  }

  private formatAttendees(usernames: string[]) {
    return usernames.map((u) => `> ${u}`).join('\n')
  }
}
