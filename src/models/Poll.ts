import { WithId } from 'mongodb'
import { ButtonInteraction, EmbedBuilder, Message, User } from 'discord.js'
import { client } from '@util/client'
import { fetchChannel, fetchMessage, setDifference } from '@util/common'
import { logger } from '@util/logger'
import { PollDocumentType, PollInterface, PollOption } from '@typings/poll.type'
import { dbInstance } from '../service/DbService'

export class Poll implements PollInterface {
  static readonly collectionName = 'polls'
  static readonly model = dbInstance.db.collection<PollDocumentType>(this.collectionName)

  public options
  public channel
  public message
  public header

  constructor({ options, channel, message, header = '' }: PollInterface) {
    this.options = options
    this.channel = channel
    this.message = message
    this.header = header
  }

  static async fetch(searchParams: Partial<WithId<PollDocumentType>>) {
    const query = Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => !!v))

    if (!Object.keys(query).length) return

    const dbPoll = await this.model.findOne({
      ...query,
    })

    if (!dbPoll) {
      logger.error('Something went wrong. Poll for query %o was not found.', query)
      return
    }

    try {
      const channel = await fetchChannel({
        id: dbPoll.channel,
        fromCache: false,
      })

      if (!channel) {
        logger.warn(`Channel ${dbPoll.channel} was not found while fetching poll ${dbPoll._id}!`)
        return
      }

      const message = await fetchMessage({
        id: dbPoll.message,
        channel,
        fromCache: false,
      })

      if (!message) {
        logger.warn(`Message ${dbPoll.message} was not found in channel ${channel.id}!`)
        return
      }

      return new Poll({
        message,
        channel,
        options: dbPoll.options,
        header: dbPoll.header,
      })
    } catch (error) {
      logger.error(error)
    }
  }

  async save(message: Message) {
    this.message = message

    const poll = await Poll.model.insertOne({
      message: this.message.id,
      channel: this.channel.id,
      options: this.options,
      header: this.header,
      active: true,
    })

    client.polls?.set(message.id, this)

    logger.info('Poll was saved into database: %o', poll)

    return poll
  }

  async end() {
    const messageId = this.message?.id

    if (!messageId) {
      logger.error(`Message id: "${messageId}" was not found while ending poll: %o`, this)
      return
    }

    client.polls?.delete(messageId)
    await Poll.model.updateOne({ message: messageId }, { $set: { active: false } })

    logger.info(`Poll ${messageId} was deactivated.`)
  }

  async hydrate() {
    const channelId = this.channel as unknown as string
    const messageId = this.message as unknown as string

    const channel = await fetchChannel({ id: channelId, fromCache: false })
    const message = await fetchMessage({
      id: messageId,
      channel: this.channel,
      fromCache: false,
    })

    if (!channel || !message) {
      logger.error(`Failed to hydrate poll %o`, this)
      return
    }

    this.channel = channel
    this.message = message

    return this
  }

  render() {
    const table = this.options.reduce((msg, option) => {
      const { text, users } = option

      const userList = users.reduce(
        (text, user, idx) => `${text}${user}${idx + 1 !== users.length ? ', ' : ''}`,
        '',
      )

      const stats = this.optionStats(option)
      const statsText = `**${stats.numReacts}**`
      const progressBar = `\n    ${stats.progressBar} (${stats.percent}%)`
      const usersText = `\n    ${userList}`

      return `${msg} ‣ ${text}${users.length ? ` - ${statsText}${progressBar}${usersText}` : ''}\n`
    }, '')

    return `🍿 **${this.header}**\n\n${table}`
  }

  report() {
    const stats = this.options
      .map((opt) => ({ opt, stat: this.optionStats(opt) }))
      .sort((a, b) => b.stat.numReacts - a.stat.numReacts)

    const winner = stats[0]

    const tied = stats
      .filter((s) => s.stat.numReacts === winner.stat.numReacts)
      .map((s) => `**${s.opt.text}**`)
    const isTie = tied.length > 1

    const allUsers = stats.reduce((acc: string[], { opt: { users } }) => [...acc, ...users], [])
    const excludedUsers = [...setDifference(new Set(allUsers), winner.opt.users)]

    const excludedText = excludedUsers.length
      ? `Votaram nas restantes mas não no vencedor: ${excludedUsers.join(', ')}`
      : ''

    const runnerText = stats
      .slice(1, 3)
      .filter((t) => t != null)
      .map(
        (t, idx) =>
          `**${idx + 2}º Lugar** – ${t.opt.text} – ${t.stat.numReacts} (${t.stat.percent}%)`,
      )

    const winnerText = `No topo ${isTie ? `estão` : `está`} ${tied.join(', ')}`

    return (
      `${winnerText} com **${winner.stat.numReacts} (${winner.stat.percent}%)** votos.` +
      `\n  Votaram ${isTie ? `na primeira` : ''}: ${winner.opt.users.join(', ')}` +
      `${isTie ? '' : `\n${runnerText.join('\n')}\n${excludedText}`}`
    )
  }

  async handleOptionChoice(interaction: ButtonInteraction) {
    const option = this.findOption(interaction)
    if (!option) {
      logger.error(
        'Could not find matching option (%o) for interaction: %o',
        this.options,
        interaction.customId,
      )
      return
    }

    const user = interaction.user

    if (option?.users.includes(user.toString())) {
      this.removeUserFromOption(user, option)
      return
    }

    this.addUserToOption(user, option)
  }

  private async addUserToOption(user: User, option: PollOption) {
    option.users = [...option.users, user.toString()]

    await Poll.model.updateOne({ message: this.message?.id }, { $set: { options: this.options } })

    await this.message?.edit({
      embeds: [new EmbedBuilder().setDescription(this.render())],
    })
  }

  private async removeUserFromOption(user: User, option: PollOption) {
    option.users = option.users.filter((u) => u !== user.toString())

    await Poll.model.updateOne({ message: this.message?.id }, { $set: { options: this.options } })

    await this.message?.edit({
      embeds: [new EmbedBuilder().setDescription(this.render())],
    })
  }

  private findOption(interaction: ButtonInteraction) {
    const { customId } = interaction

    const optionText = customId.split('-')[0]
    return this.options.find((o) => o.text === optionText)
  }

  private optionStats(option: PollOption) {
    const numReacts = option.users.length
    const totalReacts = this.options.reduce((sum, opt) => {
      return sum + opt.users.length
    }, 0)
    const percent = (numReacts / totalReacts || 0) * 100
    const progressBar = this.progressBarBuilder(percent)

    return {
      numReacts,
      percent: percent.toFixed(1),
      progressBar,
    }
  }

  private progressBarBuilder(percent: number, barLength = 15) {
    const filledElement = '█'
    const emptyElement = '▒'

    const progress = Math.floor((percent / 100) * barLength)
    const range = [...Array(barLength).keys()]

    return range
      .map((progressUnit) => (progressUnit < progress ? filledElement : emptyElement))
      .join('')
  }
}
