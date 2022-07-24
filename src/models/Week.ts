import { Collection, Message, EmbedBuilder } from 'discord.js'
import { client } from '@util/client'
import { fetchChannel, fetchMessage } from '@util/common'
import { toDate } from '@util/datetime'
import { db } from '@util/database'
import { WeekDocumentType, WeekInterface } from '@typings/week.type'
import { Dayjs } from 'dayjs'
import { logger } from '@util/logger'
import { Event } from './Event'

export class Week implements WeekInterface {
  static modelType = 'week'
  static channelName = 'calendário'

  public message
  public channel
  public weekStart
  public weekEnd
  public events

  constructor({ channel, weekStart, weekEnd, events, message }: WeekInterface) {
    this.message = message
    this.channel = channel
    this.weekStart = weekStart
    this.weekEnd = weekEnd
    this.events = events || new Collection()
  }

  static async create({ date }: { date: Dayjs }) {
    const weekStart = date.day(0)
    const weekEnd = date.day(6)
    const channel = await fetchChannel({ name: Week.channelName })

    if (!channel) {
      logger.error('Failed to fetch channel for week: %o', this)
      return
    }

    const week = new Week({ channel, weekStart, weekEnd })
    const message = await channel.send({ embeds: [week.render()] })

    week.save(message)

    return week
  }

  static async fetch(searchParams: Partial<WeekDocumentType>) {
    const query = Object.fromEntries(
      Object.entries(searchParams).filter(([_, v]) => !!v),
    )

    if (!Object.keys(query).length) return

    const week: WeekDocumentType = await db.findOne({
      model: Week.modelType,
      ...query,
    })

    return Week.hydrate(week)
  }

  static async hydrate(dbObj: WeekDocumentType) {
    const channel = await fetchChannel({ id: dbObj.channel, fromCache: false })
    const message = await fetchMessage({
      id: dbObj.message,
      channel,
      fromCache: false,
    })

    if (!channel || !message) {
      logger.error('Failed to fetch channel or message for week: %o', this)
      return
    }

    const { weekStart, weekEnd, events } = Week.deserialize(dbObj)

    const week = new Week({
      message,
      channel,
      weekStart,
      weekEnd,
      events,
    })

    return week
  }

  async save(message: Message) {
    this.message = message

    const week = await db.insert(this.serialize())
    client.calendarWeeks?.set(message.id, this)

    logger.info('Week was saved into database: %o', week)

    return week
  }

  async addEvent(event: Event) {
    const eventId = event.message?.id

    if (!eventId) {
      logger.error(
        'addEvent: attempted to add event with undefined eventId: %o',
        event,
      )
      return
    }

    this.events.set(eventId, event)
    this.message?.edit({ embeds: [this.render()] })

    await db.update(
      { model: Week.modelType, message: this.message?.id },
      { $addToSet: { events: eventId } },
    )
  }

  async removeEvent(event: Event) {
    const eventId = event.message?.id

    if (!eventId) {
      logger.error(
        'removeEvent: attempted to remove event with undefined eventId: %o',
        event,
      )
      return
    }

    this.events.delete(eventId)
    this.message?.edit({ embeds: [this.render()] })

    await db.update(
      { model: Week.modelType, message: this.message?.id },
      { $pull: { events: eventId } },
    )
  }

  render() {
    const sortedEvents = this.events.sort(
      (first, last) => first.date.unix() - last.date.unix(),
    )

    const fields = sortedEvents.map((e) => {
      const date = e.date.format('dddd, DD/MM')
      const value = `${date} - [link](${e.message?.url})`

      return { name: e.title, value, inline: false }
    })

    const [startDate, endDate] = [this.weekStart, this.weekEnd].map((d) =>
      d.format('DD/MM/YYYY'),
    )

    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Eventos na semana ${startDate} a ${endDate}`)
      .addFields(...fields)
  }

  serialize() {
    return {
      model: Week.modelType,
      message: this.message?.id,
      channel: this.channel.id,
      weekStart: this.weekStart.format('DD/MM/YYYY'),
      weekEnd: this.weekEnd.format('DD/MM/YYYY'),
      events: [...this.events.keys()],
    }
  }

  static deserialize(data: WeekDocumentType) {
    const eligibleEvents =
      client.events?.filter((e) => {
        if (!e.message) return false

        return data.events.includes(e.message.id)
      }) || new Collection()

    const events = new Collection(Array.from(eligibleEvents))

    return {
      weekStart: toDate(data.weekStart),
      weekEnd: toDate(data.weekEnd),
      events,
    }
  }
}
