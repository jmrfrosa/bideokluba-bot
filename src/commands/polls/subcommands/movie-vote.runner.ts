import { Dayjs } from 'dayjs'
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  Constants,
} from 'discord.js'
import { Poll } from '@models/Poll'
import { CommandRunnerType } from '../../../typings/command.type'
import { PollOption } from '../../../typings/poll.type'
import { now, toDate } from '@util/datetime'
import { VoteCommandNames } from '../votação.command'

const defaultHeader = 'Em que dia marcamos discussão?'

export const MovieVoteRunner: CommandRunnerType = async (interaction) => {
  const reply = await interaction.deferReply({ fetchReply: true })
  const replyId = reply.id

  const channel = interaction.channel
  if (channel?.type !== 'GUILD_TEXT') {
    await interaction.editReply({
      content: 'Canal inválido! Tenta novamente.',
    })
    return
  }

  const { startDate, endDate } = getDatesOrDefault(interaction)

  const options = buildOptions(startDate, endDate)
  const rows = buildRows(options, replyId)

  const poll = new Poll({ options, channel, header: defaultHeader })
  const body = poll.render()
  const sentMsg = (await interaction.editReply({
    content: body,
    components: rows,
  })) as Message<boolean>

  poll.save(sentMsg)
}

function getDatesOrDefault(interaction: CommandInteraction) {
  const defaultStartDate = now()
  const startDateStr = interaction.options.getString(
    VoteCommandNames.START_DATE_OPT,
  )
  const startDate = startDateStr ? toDate(startDateStr) : defaultStartDate

  const defaultEndDate = startDate.add(10, 'days')
  const endDateStr = interaction.options.getString(
    VoteCommandNames.END_DATE_OPT,
  )

  let endDate = endDateStr ? toDate(endDateStr) : defaultEndDate

  if (daysBetween(startDate, endDate) > 25) {
    endDate = startDate.add(25, 'days')
  }

  return { startDate, endDate }
}

function buildOptions(startDate: Dayjs, endDate: Dayjs) {
  const daysBetween = endDate.diff(startDate, 'days')

  return Array.from(
    { length: daysBetween },
    (_, day): PollOption => ({
      text: startDate.add(day + 1, 'day').format('ddd, DD/MM'),
      users: [],
    }),
  )
}

function buildRows(options: PollOption[], uniqueId: string) {
  let neededRows = Math.floor(options.length / 5)
  if (options.length % 5 > 0) neededRows += 1

  if (neededRows > 5) return

  return Array.from({ length: neededRows }, (_value, rowIndex) => {
    const startingIndex = rowIndex * 5
    const selectedOptions = options.slice(startingIndex, startingIndex + 5)

    const rowComponents = selectedOptions.map((option) =>
      new MessageButton()
        .setCustomId(`${option.text}-${uniqueId}`)
        .setLabel(option.text)
        .setStyle(Constants.MessageButtonStyles.SECONDARY),
    )

    const row = new MessageActionRow()
    return row.addComponents(rowComponents)
  })
}
