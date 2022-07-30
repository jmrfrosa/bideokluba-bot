import { ObjectId } from 'mongodb'
import { Collection } from 'discord.js'
import { client } from '@util/client'
import { Poll } from '@models/Poll'
import { logger } from '@util/logger'

export class PollLoader {
  static async add(id: string) {
    const poll = await Poll.fetch({ _id: new ObjectId(id) })

    if (!poll?.message) {
      logger.warn(`Poll ${id} could not be fetched!`)

      PollLoader.unload(id, true)
      return
    }

    client.polls?.set(poll.message.id, poll)

    logger.info(`Poll ${id} fetched and added to reaction listeners.`)
  }

  static async load() {
    client.polls = new Collection()

    logger.info('Fetching existing polls...')

    const activePollsDocs = Poll.model.find({ active: true })
    const activePolls = await activePollsDocs.toArray()

    const pollIds = activePolls.map((p) => p._id)

    logger.info(`Found ${pollIds.length} polls running.`)

    for (const id of pollIds) {
      await PollLoader.add(id.toString())
    }
  }

  static async unload(id: string, checkDb = false) {
    const inClient = client.polls?.has(id)
    const inDb = checkDb
      ? await Poll.model.findOne({ _id: new ObjectId(id) })
      : false

    if (inClient || inDb) {
      logger.info(`Poll ${id} has been deleted. Removing from records.`)

      client.polls?.delete(id)
      await Poll.model.deleteMany({ _id: new ObjectId(id) }, {})
    }
  }

  static async archive(id: string) {
    logger.info(
      `Archiving poll ${id}. This poll can be unarchived at any time.`,
    )

    client.polls?.delete(id)
    await Poll.model.updateMany(
      { _id: new ObjectId(id) },
      { $set: { active: false } },
    )
  }

  static async unarchive(id: string) {
    logger.info(
      `Unarchiving poll ${id}. This poll can be archived at any time.`,
    )

    PollLoader.add(id)
  }
}
