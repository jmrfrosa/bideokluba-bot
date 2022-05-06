import { Collection, MessageReaction, User } from 'discord.js'
import { client } from '../util/client'
import { db } from '../util/database'
import { Event } from '../models/Event'
import { now, toDate } from '../util/datetime'
import { logger } from '../util/logger'
import { EventDocumentType } from '../typings/event.type'

export class EventLoader {
  static async add(id: string) {
    const event = await Event.fetch({ _id: id })

    if (!event?.message) {
      logger.warn(`Event ${id} could not be fetched!`)

      EventLoader.unload(id, true)
      return
    }

    client.events?.set(event.message.id, event)

    logger.info(`Event ${id} fetched and added to reaction listeners.`)
  }

  static async load() {
    client.events = new Collection()

    logger.info('Fetching existing events...')

    const dbEvents: EventDocumentType[] = await db.find({
      model: Event.modelType,
      active: true,
    })

    logger.info(`Found ${dbEvents.length} events running.`)

    for (const event of dbEvents) {
      const outdatedEvent = event.date && now().isAfter(toDate(event.date))

      if (!outdatedEvent) await EventLoader.add(event._id)
    }
  }

  static async unload(id: string, checkDb = false) {
    const inClient = client.events?.has(id)
    const inDb = checkDb
      ? await db.findOne({ model: Event.modelType, _id: id })
      : false

    if (inClient || inDb) {
      logger.info(`Event ${id} has been deleted. Removing from records.`)

      client.events?.delete(id)
      await db.remove({ model: Event.modelType, _id: id }, {})
    }
  }

  static async archive(id: string) {
    logger.info(
      `Archiving event ${id}. This event can be unarchived at any time.`,
    )

    client.events?.delete(id)
    await db.update(
      { model: Event.modelType, _id: id },
      { $set: { active: false } },
    )
  }

  static async unarchive(id: string) {
    logger.info(
      `Unarchiving event ${id}. This event can be archived at any time.`,
    )

    EventLoader.add(id)
  }

  static reactionHandler(
    reaction: MessageReaction,
    user: User,
  ): typeof Event.options[keyof typeof Event.options] {
    reaction.users.remove(user)

    const reactionName = reaction.emoji.name as keyof typeof Event.options

    return Event.options[reactionName]
  }
}
