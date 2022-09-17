import { ChannelType } from 'discord.js'
import { Poll } from '@models/Poll'
import { CommandRunnerType } from '@typings/command.type'
import { MovieCommandNames } from '../movies.command'
import { parseMessageId } from '@util/common'
import { Movie } from '@models/Movie'
import { entityCache } from '@service/CacheService'
import { CacheNames } from '@typings/enums'
import { buildPollOptionSelect, parsePollDates } from '@helpers/poll.helper'

const defaultHeader = 'Em que dia marcamos discussão?'

export const VoteMovieRunner: CommandRunnerType = async (interaction) => {
  const reply = await interaction.deferReply({ fetchReply: true })
  const replyId = reply.id

  const channel = interaction.channel
  if (channel?.type !== ChannelType.GuildText) {
    await interaction.editReply({
      content: 'Canal inválido! Tenta novamente.',
    })
    return
  }

  const startDateStr = interaction.options.getString(MovieCommandNames.START_DATE_OPT, false)
  const endDateStr = interaction.options.getString(MovieCommandNames.END_DATE_OPT, false)

  const { startDate, endDate } = parsePollDates(startDateStr, endDateStr)

  const movieIdOrUrl = interaction.options.getString(MovieCommandNames.MOVIE_OPT, false)
  const movie =
    movieIdOrUrl && (await entityCache.find(parseMessageId(movieIdOrUrl), CacheNames.Movies))

  const { options, rows } = buildPollOptionSelect(startDate, endDate, replyId)

  const header = movie instanceof Movie ? `Discussão do ${movie.title}` : defaultHeader

  const poll = new Poll({ options, channel, header, ...(movie && { movie }) })
  const embed = poll.render()
  const sentMsg = await interaction.editReply({
    components: rows,
    embeds: [embed],
  })

  poll.save(sentMsg)
}
