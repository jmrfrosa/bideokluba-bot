import { WithId } from 'mongodb'
import { Collection, Message, EmbedBuilder } from 'discord.js'
import { fetchChannel, fetchMessage } from '@util/common'
import { toDateTime } from '@util/datetime'
import { WeekDocumentType, WeekInterface } from '@typings/week.type'
import { Dayjs } from 'dayjs'
import { logger } from '@util/logger'
import { Event } from './Event'
import { dbInstance } from '@service/DbService'
import { entityCache } from '@service/CacheService'

export class Week implements WeekInterface {
  static readonly collectionName = 'weeks'
  static readonly model = dbInstance.db.collection<WeekDocumentType>(this.collectionName)
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

  static async fetch(searchParams: Partial<WithId<WeekDocumentType>>) {
    const query = Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => !!v))

    if (!Object.keys(query).length) return

    const dbWeek = await this.model.findOne({
      ...query,
    })

    if (!dbWeek) {
      logger.error('Something went wrong. Week for query %o was not found.', query)
      return
    }

    return Week.hydrate(dbWeek)
  }

  static async hydrate(dbWeek: WithId<WeekDocumentType>) {
    const channel = await fetchChannel({ id: dbWeek.channel, fromCache: false })
    const message = await fetchMessage({
      id: dbWeek.message,
      channel,
      fromCache: false,
    })

    if (!channel || !message) {
      logger.error('Failed to fetch channel or message for week: %o', this)
      return
    }

    const { weekStart, weekEnd, events } = await Week.deserialize(dbWeek)

    const week = new Week({
      message,
      channel,
      weekStart,
      weekEnd,
      events: new Collection(),
    })

    await week.hydrateEvents(events)

    return week
  }

  async save(message: Message) {
    this.message = message

    const serializedWeek = this.serialize()

    if (!serializedWeek) {
      logger.error('Something went wrong while serializing week: %o', this)
      return
    }

    const week = await Week.model.insertOne(serializedWeek)
    entityCache.weeks.set(message.id, this)

    logger.info('Week was saved into database: %o', week)

    return week
  }

  async addEvent(event: Event) {
    const eventId = event.message?.id

    if (!eventId) {
      logger.error('addEvent: attempted to add event with undefined eventId: %o', event)
      return
    }

    this.events.set(eventId, event)
    this.message?.edit({ embeds: [this.render()] })

    await Week.model.updateOne({ message: this.message?.id }, { $addToSet: { events: eventId } })
  }

  async removeEvent(event: Event) {
    const eventId = event.message?.id

    if (!eventId) {
      logger.error('removeEvent: attempted to remove event with undefined eventId: %o', event)
      return
    }

    this.events.delete(eventId)
    this.message?.edit({ embeds: [this.render()] })

    await Week.model.updateOne({ message: this.message?.id }, { $pull: { events: eventId } })
  }

  render() {
    const sortedEvents = this.events.sort((first, last) => first.date.unix() - last.date.unix())

    const fields = sortedEvents.map((e) => {
      const date = e.date.format('dddd, DD/MM')
      const value = `${date} - [link](${e.message?.url})`

      return { name: e.title, value, inline: false }
    })

    const [startDate, endDate] = [this.weekStart, this.weekEnd].map((d) => d.format('DD/MM/YYYY'))

    return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Eventos na semana ${startDate} a ${endDate}`)
      .addFields(...fields)
  }

  serialize() {
    if (!this.message || typeof this.message === 'string') {
      logger.error('Error while serializing week, properties are not properly hydrated: %o', this)
      return
    }

    return {
      message: this.message.id,
      channel: this.channel.id,
      weekStart: this.weekStart.toDate(),
      weekEnd: this.weekEnd.toDate(),
      events: [...this.events.keys()],
    }
  }

  async hydrateEvents(eventIds: string[]) {
    const events: [string, Event][] = []
    for (const messageId of eventIds) {
      const cachedEvent = entityCache.events.get(messageId)
      if (cachedEvent) {
        events.push([messageId, cachedEvent])
        continue
      }

      const dbEvent = await Event.model.findOne({ message: messageId })
      if (!dbEvent) continue

      const event = await Event.hydrate(dbEvent, this)
      if (!event) continue

      events.push([messageId, event])
    }

    this.events = new Collection<string, Event>(events)
  }

  static async deserialize(data: WeekDocumentType) {
    return {
      weekStart: toDateTime(data.weekStart),
      weekEnd: toDateTime(data.weekEnd),
      events: data.events,
    }
  }
}
