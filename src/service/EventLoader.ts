import { ObjectId } from 'mongodb'
import { Collection, MessageReaction, User } from 'discord.js'
import { client } from '@util/client'
import { Event } from '@models/Event'
import { now, toDate } from '@util/datetime'
import { logger } from '@util/logger'

export class EventLoader {
  static async add(id: string) {
    const event = await Event.fetch({ _id: new ObjectId(id) })

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

    const dbEvents = await Event.model
      .find({
        active: true,
      })
      .toArray()

    logger.info(`Found ${dbEvents.length} events running.`)

    for (const event of dbEvents) {
      const outdatedEvent = event.date && now().isAfter(toDate(event.date))

      if (!outdatedEvent) await EventLoader.add(event._id.toString())
    }
  }

  static async unload(id: string, checkDb = false) {
    const inClient = client.events?.has(id)
    const inDb = checkDb
      ? await Event.model.findOne({ _id: new ObjectId(id) })
      : false

    if (inClient || inDb) {
      logger.info(`Event ${id} has been deleted. Removing from records.`)

      client.events?.delete(id)
      await Event.model.deleteOne({ _id: new ObjectId(id) }, {})
    }
  }

  static async archive(id: string) {
    logger.info(
      `Archiving event ${id}. This event can be unarchived at any time.`,
    )

    client.events?.delete(id)
    await Event.model.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: false } },
    )
  }

  static async unarchive(id: string) {
    logger.info(
      `Unarchiving event ${id}. This event can be archived at any time.`,
    )

    await Event.model.updateOne(
      { _id: new ObjectId(id) },
      { $set: { active: true } },
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
