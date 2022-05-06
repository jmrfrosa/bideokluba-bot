import { Collection } from 'discord.js'
import { client } from '../util/client'
import { db } from '../util/database'
import { Poll } from '../models/Poll'
import { logger } from '../util/logger'

export class PollLoader {
  static async add(id: string) {
    const poll = await Poll.fetch(id)

    if (!poll) {
      logger.warn(`Poll ${id} could not be fetched!`)

      PollLoader.unload(id, true)
      return
    }

    client.polls?.set(id, poll)

    logger.info(`Poll ${id} fetched and added to reaction listeners.`)
  }

  static async load() {
    client.polls = new Collection()

    logger.info('Fetching existing polls...')

    const activePolls = await db.find({ model: 'poll', active: true })
    const pollIds = activePolls.map((p) => p._id)

    logger.info(`Found ${pollIds.length} polls running.`)

    for (const id of pollIds) {
      await PollLoader.add(id)
    }
  }

  static async unload(id: string, checkDb = false) {
    const inClient = client.polls?.has(id)
    const inDb = checkDb ? await db.findOne({ model: 'poll', _id: id }) : false

    if (inClient || inDb) {
      logger.info(`Poll ${id} has been deleted. Removing from records.`)

      client.polls?.delete(id)
      await db.remove({ model: 'poll', _id: id }, {})
    }
  }

  static async archive(id: string) {
    logger.info(
      `Archiving poll ${id}. This poll can be unarchived at any time.`,
    )

    client.polls?.delete(id)
    await db.update({ model: 'poll', _id: id }, { $set: { active: false } })
  }

  static async unarchive(id: string) {
    logger.info(
      `Unarchiving poll ${id}. This poll can be archived at any time.`,
    )

    PollLoader.add(id)
  }
}
