import {
  ActionRowBuilder,
  TextChannel,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} from 'discord.js'
import { Event } from '@models/Event'
import { CommandRunnerType } from '@typings/command.type'
import { fetchChannel } from '@util/common'
import { toDate } from '@util/datetime'
import { logger } from '@util/logger'

export const CreateEventRunner: CommandRunnerType = async (interaction) => {
  const reply = await interaction.deferReply({ fetchReply: true })
  const replyId = reply.id

  const author = (interaction.member as GuildMember).displayName

  if (!author) {
    logger.error(
      'cmdEvento#run: Something went wrong while parsing interaction member. %o',
      interaction,
    )
    return
  }

  const title = interaction.options.getString('title', true)
  const dateStr = interaction.options.getString('date', true)
  const channelStr = interaction.options.getString('channel', false)

  const date = toDate(dateStr)
  const channel = channelStr
    ? await fetchChannel({ name: channelStr })
    : (interaction.channel as TextChannel)

  if (!channel) {
    await interaction.editReply(
      'Não consegui encontrar esse canal! Escreve como está na barra lateral sff.',
    )
    return
  }

  const event = new Event({ channel, title, date, author })
  const body = event.render()

  const row = new ActionRowBuilder<ButtonBuilder>()
  Object.keys(Event.options).forEach((option) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`${option}-${replyId}`)
        .setLabel(option)
        .setStyle(ButtonStyle.Secondary),
    )
  })

  const msg = await interaction.editReply({
    embeds: [body],
    components: [row],
  })

  event.save(msg)
}
