import { Collection } from 'discord.js'
import { client } from '../util/client'
import { db } from '../util/database'
import { Week } from '../models/Week'
import { now, toDate } from '../util/datetime'
import { logger } from '../util/logger'

type WeekDocumentType = {
  _id: string
  model: string
  message: string
  channel: string
  weekStart: string
  weekEnd: string
  events: string[]
}

export class WeekLoader {
  static async add(id: string) {
    const week = await Week.fetch({ _id: id })

    if (!week?.message) {
      logger.warn(`Week ${id} could not be fetched!`)

      WeekLoader.unload(id, true)
      return
    }

    client.calendarWeeks?.set(week.message.id, week)

    logger.info(`Calendar week ${id} fetched.`)
  }

  static async load() {
    client.calendarWeeks = new Collection()

    logger.info('Fetching calendar...')

    const dbWeeks: WeekDocumentType[] = await db.find({ model: Week.modelType })

    logger.info(`Found ${dbWeeks.length} weeks in calendar.`)

    for (const week of dbWeeks) {
      const outdatedWeek = week.weekEnd && now().isAfter(toDate(week.weekEnd))

      if (!outdatedWeek) await WeekLoader.add(week._id)
    }

    WeekLoader.syncEvents()
  }

  static async unload(id: string, checkDb = false) {
    const inClient = client.calendarWeeks?.has(id)
    const inDb = checkDb
      ? await db.findOne({ model: Week.modelType, _id: id })
      : false

    if (inClient || inDb) {
      logger.info(`Week ${id} has been deleted. Removing from records.`)

      client.calendarWeeks?.delete(id)
      await db.remove({ model: Week.modelType, _id: id }, {})
    }
  }

  static syncEvents() {
    client.calendarWeeks?.forEach((week) => {
      week.events.forEach((event) => {
        event.week = week
      })
    })
  }
}
