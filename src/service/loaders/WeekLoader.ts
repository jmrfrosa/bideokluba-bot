import { ObjectId } from 'mongodb'
import { Week } from '@models/Week'
import { now, toDate } from '@util/datetime'
import { logger } from '@util/logger'
import { entityCache } from '../CacheService'

export class WeekLoader {
  static async add(id: string) {
    const week = await Week.fetch({ _id: new ObjectId(id) })

    if (!week?.message) {
      logger.warn(`Week ${id} could not be fetched!`)

      WeekLoader.unload(id, true)
      return
    }

    entityCache.weeks.set(week.message.id, week)

    logger.info(`Calendar week ${id} cached.`)
  }

  static async load() {
    logger.info('Fetching calendar...')

    const dbWeeks = await Week.model.find({}).toArray()

    logger.info(`Found ${dbWeeks.length} weeks in calendar.`)

    for (const week of dbWeeks) {
      const outdatedWeek = week.weekEnd && now().isAfter(toDate(week.weekEnd))

      if (!outdatedWeek) await WeekLoader.add(week._id.toString())
    }

    WeekLoader.syncEvents()
  }

  static async unload(id: string, checkDb = false) {
    const inClient = entityCache.weeks.has(id)
    const inDb = checkDb ? await Week.model.findOne({ _id: new ObjectId(id) }) : false

    if (inClient || inDb) {
      logger.info(`Week ${id} has been deleted. Removing from records.`)

      entityCache.weeks.delete(id)
      await Week.model.deleteOne({ _id: new ObjectId(id) }, {})
    }
  }

  static syncEvents() {
    entityCache.weeks.forEach((week) => {
      week.events.forEach((event) => {
        event.week = week
      })
    })
  }
}
