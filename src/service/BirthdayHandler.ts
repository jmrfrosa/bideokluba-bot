import nodeCron from 'node-cron'
import { EmbedBuilder } from 'discord.js'
import { client } from '@util/client'
import { logger } from '@util/logger'
import { fetchChannel, fetchUser } from '@util/common'
import { channels } from '@util/constants'
import { db } from '@util/database'
import { now, toDate } from '@util/datetime'
import { BirthdayDocumentType } from '@typings/birthday.type'

export class BirthdayHandler {
  static isToday(birthday: BirthdayDocumentType) {
    return now().isSame(toDate(birthday.date), 'day')
  }

  static async checkBirthdays() {
    logger.info('Checking birthdays...')

    const birthdays: BirthdayDocumentType[] = await db.find({
      model: 'birthday',
    })

    const validBirthdays = birthdays.filter(BirthdayHandler.isToday)

    if (validBirthdays.length === 0) {
      logger.info('No birthdays found today.')
      return
    }

    logger.info('Valid birthdays were found today: %o', validBirthdays)

    const message = await BirthdayHandler.render(validBirthdays)
    const channel = await fetchChannel({ name: channels.offtopic })

    if (!message || !channel) return

    await channel.send({ embeds: [message] })
  }

  static async render(birthdays: BirthdayDocumentType[]) {
    const users = await Promise.all(
      birthdays.map(({ userId }) => {
        return fetchUser({ id: userId })
      }),
    )

    if (users.length === 0) return

    const mentions = users.map((user) => user.toString()).join(' ')

    return new EmbedBuilder()
      .setThumbnail(
        'https://icons-for-free.com/iconfiles/png/512/gift+pink+ribbon+icon-1320165657145611265.png',
      )
      .setTitle('📨 Lembretes de Aniversário')
      .setDescription(`PARABÉNS ${mentions}! 🎉 🎁`)
      .setTimestamp()
  }

  static scheduler() {
    return (client.birthdayScheduler ??= nodeCron.schedule(
      '0 0 * * *',
      BirthdayHandler.checkBirthdays,
      {
        scheduled: false,
        timezone: 'Europe/Lisbon',
      },
    ))
  }

  static start() {
    logger.info('Started birthday scheduler!')

    BirthdayHandler.scheduler().start()
  }

  static stop() {
    logger.info('Stopped birthday scheduler!')

    BirthdayHandler.scheduler().stop()
  }
}
