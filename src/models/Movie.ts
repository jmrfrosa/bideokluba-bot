import {
  ActionRowBuilder,
  APIEmbedField,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  Message,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionsBitField,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  time,
  User,
} from 'discord.js'
import { WithId } from 'mongodb'
import { dbInstance } from '../service/DbService'
import { MovieDocumentType, MovieInterface } from '../typings/movie.type'
import { BooleanFilter } from '../typings/util'
import { fetchChannel, fetchMessage, fetchUser } from '../util/common'
import { now, toDateTime } from '../util/datetime'
import { logger } from '../util/logger'
import { Poll } from './Poll'
import { Movie as MovieData } from 'imdb-api'
import { entityCache } from '../service/CacheService'
import { CacheNames } from '../typings/enums'
import { Dayjs } from 'dayjs'

export class Movie implements MovieInterface {
  static readonly collectionName = 'movies'
  static readonly model = dbInstance.db.collection<MovieDocumentType>(this.collectionName)
  static readonly channelName = 'info'
  static readonly options = [
    { id: 'discuss', label: 'Marcar como discutido', emoji: '✅' },
    { id: 'edit', label: 'Editar', emoji: '✏️' },
    { id: 'delete', label: 'Apagar', emoji: '🗑' },
    { id: 'vote', label: 'Criar Votação', emoji: '📊' },
  ]

  public message: Message<boolean>
  public channel: TextChannel
  public title: string
  public url: string
  public links: string[]
  public poster?: string
  public year?: number
  public director?: string
  public curator?: User
  public discussionDate?: Dayjs
  public polls: Poll[]

  constructor({
    message,
    channel,
    title,
    url,
    links,
    poster,
    year,
    director,
    curator,
    discussionDate,
    polls,
  }: MovieInterface) {
    this.message = message
    this.channel = channel
    this.title = title
    this.url = url
    this.links = links || []
    this.poster = poster
    this.year = year
    this.director = director
    this.curator = curator
    this.discussionDate = discussionDate
    this.polls = polls || []
  }

  static async latestMovie() {
    const dbMovie = await this.model.findOne({}, { sort: { _id: -1 } })
    if (!dbMovie) return

    return entityCache.find(dbMovie.message, CacheNames.Movies)
  }

  static async createFromImdb(movieData: MovieData, curator?: User | null) {
    const channel = await fetchChannel({ name: Movie.channelName })

    if (!channel) {
      logger.error(
        'Movie#createFromImdb: #info channel was not found in guild. Interrupting interaction.',
      )
      return
    }

    const message = await channel.send({
      embeds: [new EmbedBuilder().setTitle('Em construção... 🚧')],
    })

    const movie = new Movie({
      message,
      channel,
      title: movieData.title,
      url: movieData.imdburl,
      year: movieData.year,
      director: movieData.director,
      poster: movieData.poster,
      links: [],
      polls: [],
      ...(curator && { curator }),
    })

    return await movie.save()
  }

  static async fetch(searchParams: Partial<WithId<MovieDocumentType>>) {
    const query = Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => !!v))

    if (!Object.keys(query).length) return

    const movie = await this.model.findOne({
      ...query,
    })

    if (!movie) {
      logger.error('Something went wrong. Movie for query %o was not found.', query)
      return
    }

    return await Movie.hydrate(movie)
  }

  static async hydrate(dbObj: WithId<MovieDocumentType>) {
    const deserializedMovie = await this.deserialize(dbObj)

    if (!deserializedMovie) return

    const { channel, message, polls } = deserializedMovie

    if (!channel || !message) {
      logger.error(
        'Failed to fetch movie channel %o or message %o. Operation interrupted.',
        dbObj.channel,
        dbObj.message,
      )

      return
    }

    const movie = new Movie({
      ...deserializedMovie,
      channel,
      message,
      polls: [],
    })

    await movie.hydratePolls(polls)

    return movie
  }

  static async deserialize(data: WithId<MovieDocumentType>) {
    try {
      const channel = await fetchChannel({ id: data.channel, fromCache: false })

      return {
        channel,
        message: await fetchMessage({ id: data.message, channel, fromCache: false }),
        title: data.title,
        url: data.url,
        links: data.links,
        poster: data.poster,
        year: data.year,
        director: data.director,
        curator: data.curator ? await fetchUser({ id: data.curator }) : undefined,
        discussionDate: data.discussionDate ? toDateTime(data.discussionDate) : undefined,
        polls: data.polls,
      }
    } catch (error) {
      logger.error({
        error,
        msg: `Failed to deserialize movie ${data._id}! Operation interrupted.`,
      })
      return
    }
  }

  serialize() {
    return {
      message: this.message.id,
      channel: this.channel.id,
      title: this.title,
      url: this.url,
      links: this.links,
      poster: this.poster,
      year: this.year,
      director: this.director,
      curator: this.curator?.id,
      discussionDate: this.discussionDate?.toDate(),
      polls: this.polls.map((poll) => poll.message?.id).filter(BooleanFilter),
    }
  }

  async save() {
    const payload = this.serialize()

    await Movie.model.insertOne(payload)
    entityCache.movies.set(this.message.id, this)

    await this.render()

    return this
  }

  async hydratePolls(pollIds: string[]) {
    const polls: Poll[] = []
    for (const messageId of pollIds) {
      const cachedPoll = entityCache.polls.get(messageId)
      if (cachedPoll) {
        polls.push(cachedPoll)
        continue
      }

      const dbPoll = await Poll.model.findOne({ message: messageId })
      if (!dbPoll) continue

      const poll = await Poll.hydrate(dbPoll, this)
      if (!poll) continue

      polls.push(poll)
    }

    this.polls = polls
  }

  async render() {
    const curatorText = this.curator ? `${this.curator}` : 'Curadoria geral'
    const linksText = this.links?.length
      ? this.links.map((url, idx) => `‣ [Link ${idx + 1}](${url})`).join('\n')
      : null
    const pollsText = this.polls?.length
      ? this.polls.map((poll, idx) => `‣ [Ver Votação ${idx + 1}](${poll.message?.url})`).join('\n')
      : null

    const fields: APIEmbedField[] = [{ name: 'Curador', value: curatorText, inline: true }]

    this.year && fields.push({ name: 'Ano', value: String(this.year), inline: true })
    this.director && fields.push({ name: 'Realizador', value: this.director, inline: true })
    linksText && fields.push({ name: 'Links', value: linksText })
    pollsText && fields.push({ name: 'Votações', value: pollsText })
    this.discussionDate &&
      fields.push({ name: 'Discutido em', value: time(this.discussionDate.toDate()) })

    const embed = new EmbedBuilder()
      .setTitle(this.title)
      .setURL(this.url)
      .addFields(fields)
      .setImage(this.poster || null)

    const components = this.isDiscussed() ? [] : [this.renderButtons()]

    await this.message.edit({ embeds: [embed], components })
  }

  isDiscussed() {
    return Boolean(this.discussionDate)
  }

  async addPoll(poll: Poll) {
    if (!poll.message?.id) return
    if (!this.polls.find(({ message }) => message?.id === poll.message?.id)) this.polls.push(poll)

    await Movie.model.updateOne(
      { message: this.message.id },
      { $push: { polls: poll.message?.id } },
    )

    await this.render()
  }

  async handleOptionChoice(interaction: ButtonInteraction) {
    if (!interaction.inCachedGuild()) return

    const { member, customId } = interaction
    const [optionId, ..._messageId] = customId.split('-')
    const state = Movie.options.find((opt) => opt.id === optionId)

    if (!state) {
      logger.error(
        'Movie#handleOptionChoice: Movie button interaction %o did not match a known state',
        interaction.customId,
      )
      return
    }

    const userIsModerator = (member?.permissions as Readonly<PermissionsBitField>)?.has(
      PermissionsBitField.Flags.ManageMessages,
    )
    const hasPermissions = userIsModerator

    if (!hasPermissions) {
      await interaction.reply({
        content: 'Não tens permissão para efectuar esta acção!',
        ephemeral: true,
      })

      return
    }

    switch (state.id) {
      case 'discuss':
        await this.handleDiscussInteraction(interaction)
        break
      case 'edit':
        await this.handleEditInteraction(interaction)
        break
      case 'delete':
        await this.handleRemoveInteraction(interaction)
        break
      case 'vote':
        await this.handleVoteInteraction(interaction)
        break
      default:
        await interaction.deferUpdate()
        break
    }
  }

  async handleModalSubmission(interaction: ModalSubmitInteraction) {
    if (!interaction.isFromMessage()) return

    const { customId } = interaction

    const [modalType, _movieId] = customId.split('-')

    switch (modalType) {
      case 'editModal':
        await this.handleEditModalSubmission(interaction)
        break
      case 'voteModal':
        await this.handleVoteModalSubmission(interaction)
        break
      default:
        break
    }
  }

  private async handleEditModalSubmission(interaction: ModalSubmitInteraction) {
    const { customId } = interaction

    const linksStr = interaction.fields.getTextInputValue(`links-${customId}`)
    this.links = linksStr.split(',').map((str) => str.trim())

    await Movie.model.updateOne({ message: this.message.id }, { $set: { links: this.links } })
    await this.render()
  }

  private async handleVoteModalSubmission(interaction: ModalSubmitInteraction) {
    const { customId } = interaction

    const startDateStr = interaction.fields.getTextInputValue(`startDate-${customId}`)
    const endDateStr = interaction.fields.getTextInputValue(`endDate-${customId}`)

    await Poll.buildMoviePoll(this, startDateStr, endDateStr)
  }

  private async handleDiscussInteraction(interaction: ButtonInteraction) {
    this.discussionDate = now()

    await Movie.model.updateOne(
      { message: this.message.id },
      { $set: { discussionDate: this.discussionDate.toDate() } },
    )

    await interaction.deferUpdate()
    await this.render()
  }

  private async handleEditInteraction(interaction: ButtonInteraction) {
    const modal = this.buildEditModal()

    await interaction.showModal(modal)
  }

  private async handleRemoveInteraction(interaction: ButtonInteraction) {
    logger.trace('Removing movie: %o', this.message?.id)

    await interaction.deferUpdate()
    await interaction.message.delete()
    await Movie.model.deleteOne({ message: this.message.id })

    entityCache.movies.delete(this.message.id)
  }

  private async handleVoteInteraction(interaction: ButtonInteraction) {
    const modal = this.buildVoteModal()

    await interaction.showModal(modal)
  }

  private buildEditModal() {
    const modalId = `editModal-${this.message.id}`
    const modal = new ModalBuilder().setCustomId(modalId).setTitle(`Editar ${this.title}`)

    const linksInput = new TextInputBuilder()
      .setCustomId(`links-${modalId}`)
      .setLabel('Links do filme (separar com vírgula)')
      .setStyle(TextInputStyle.Paragraph)
      .setValue(this.links.join(', '))

    const editLinksRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      linksInput,
    )

    modal.addComponents(editLinksRow)

    return modal
  }

  private buildVoteModal() {
    const modalId = `voteModal-${this.message.id}`
    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle(`Criar votação para ${this.title}`)

    const startDateInput = new TextInputBuilder()
      .setCustomId(`startDate-${modalId}`)
      .setLabel('Data inicial (optional)')
      .setStyle(TextInputStyle.Short)
      .setValue(now().format('DD/MM/YYYY'))
      .setRequired(false)

    const endDateInput = new TextInputBuilder()
      .setCustomId(`endDate-${modalId}`)
      .setLabel('Data final (opcional)')
      .setStyle(TextInputStyle.Short)
      .setValue(now().add(10, 'days').format('DD/MM/YYYY'))
      .setRequired(false)

    const startDateRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      startDateInput,
    )

    const endDateRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      endDateInput,
    )

    modal.addComponents(startDateRow, endDateRow)

    return modal
  }

  private renderButtons() {
    const row = new ActionRowBuilder<ButtonBuilder>()

    Movie.options.forEach((option) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`${option.id}-${this.message.id}`)
          .setEmoji(option.emoji)
          .setStyle(ButtonStyle.Secondary),
      )
    })

    return row
  }
}
