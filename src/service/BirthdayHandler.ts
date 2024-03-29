import { schedule } from 'node-cron'
import { EmbedBuilder, TextChannel } from 'discord.js'
import { client } from '@util/client'
import { logger } from '@util/logger'
import { fetchChannel, fetchUser } from '@util/common'
import { channels } from '@util/constants'
import { now, toDate } from '@util/datetime'
import { BirthdayDocumentType } from '@typings/birthday.type'
import { Birthday } from '../models/Birthday'

export class BirthdayHandler {
  static isToday(birthday: BirthdayDocumentType) {
    return now().isSame(toDate(birthday.date), 'day')
  }

  static async checkBirthdays() {
    logger.info('Checking birthdays...')

    const birthdays = await Birthday.model.find({}).toArray()

    const validBirthdays = birthdays.filter(BirthdayHandler.isToday)

    if (validBirthdays.length === 0) {
      logger.info('No birthdays found today.')
      return
    }

    logger.info('Valid birthdays were found today: %o', validBirthdays)

    const channel = await fetchChannel({ name: channels.offtopic })

    if (!channel) {
      logger.error(`Could not find channel ${channels.offtopic}`)
      return
    }

    const message = await BirthdayHandler.render(validBirthdays, channel)

    if (!message) return

    await channel.send({ embeds: [message] })
  }

  static async render(birthdays: BirthdayDocumentType[], channel: TextChannel) {
    const users = await Promise.all(
      birthdays.map(({ userId }) => {
        return fetchUser({ id: userId })
      }),
    )

    if (users.length === 0) return

    const mentions = users
      .map((user) => {
        const member = channel.members.find((m) => m.user.id === user.id)

        if (!member) return user.toString()

        return member.nickname
      })
      .join(' ')

    return new EmbedBuilder()
      .setThumbnail(
        'https://icons-for-free.com/iconfiles/png/512/gift+pink+ribbon+icon-1320165657145611265.png',
      )
      .setTitle('📨 Lembretes de Aniversário')
      .setDescription(`PARABÉNS ${mentions}! 🎉 🎁`)
      .setTimestamp()
  }

  static scheduler() {
    return (client.birthdayScheduler ??= schedule(
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
