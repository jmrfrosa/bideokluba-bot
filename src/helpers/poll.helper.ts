import { PollOption } from '@typings/poll.type'
import { now, toDate } from '@util/datetime'
import { Dayjs } from 'dayjs'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

const buildPollOptions = (startDate: Dayjs, endDate: Dayjs) => {
  const daysBetween = endDate.diff(startDate, 'days')

  return Array.from(
    { length: daysBetween },
    (_, day): PollOption => ({
      text: startDate.add(day + 1, 'day').format('ddd, DD/MM'),
      users: [],
    }),
  )
}

export const buildPollButtonRows = (startDate: Dayjs, endDate: Dayjs, messageId: string) => {
  const options = buildPollOptions(startDate, endDate)

  let neededRows = Math.floor(options.length / 5)
  if (options.length % 5 > 0) neededRows += 1

  // Note: check not enforced to ensure we always return
  // if (neededRows > 5) return

  const rows = Array.from({ length: neededRows }, (_value, rowIndex) => {
    const startingIndex = rowIndex * 5
    const selectedOptions = options.slice(startingIndex, startingIndex + 5)

    const rowComponents = selectedOptions.map((option) =>
      new ButtonBuilder()
        .setCustomId(`${option.text}-${messageId}`)
        .setLabel(option.text)
        .setStyle(ButtonStyle.Secondary),
    )

    const row = new ActionRowBuilder<ButtonBuilder>()
    return row.addComponents(rowComponents)
  })

  return { options, rows }
}

export const parsePollDates = (startDateString?: string | null, endDateString?: string | null) => {
  const defaultStartDate = now()
  const startDate = startDateString ? toDate(startDateString) : defaultStartDate

  const defaultEndDate = startDate.add(10, 'days')

  let endDate = endDateString ? toDate(endDateString) : defaultEndDate

  const daysBetween = endDate.diff(startDate, 'days')
  if (daysBetween >= 25) {
    endDate = startDate.add(24, 'days')
  }

  return { startDate, endDate }
}
