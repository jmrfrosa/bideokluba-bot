import { TextChannel } from 'discord.js'
import { CommandRunnerType } from '@typings/command.type'
import { fetchMessage } from '@util/common'
import { logger } from '@util/logger'
import { AdminCommandNames } from '../admin.command'

export const MoveMessagesRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply()

  const channel = interaction.options.getChannel(AdminCommandNames.CHANNEL_OPT)
  if (channel?.type !== 'GUILD_TEXT') {
    await interaction.editReply({
      content: 'Canal inválido! Tenta novamente.',
    })
    return
  }

  const messagesStr = interaction.options.getString(
    AdminCommandNames.MESSAGES_OPT,
  )

  const messageIds = messagesStr?.split(' ')
  if (!messageIds?.length) {
    logger.error('Move command: No message ids were found: %o', interaction)
    return
  }

  for (const id of messageIds) {
    const message = await fetchMessage({
      id,
      channel: interaction.channel as TextChannel,
      fromCache: false,
    })

    if (!message) {
      logger.error('Move command: Message id was not found: %s', id)
      continue
    }

    const dateOpts: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'long',
    }
    const msgDate = new Intl.DateTimeFormat('pt-PT', dateOpts).format(
      message.createdAt,
    )

    const header = `_Mensagem movida_ (${message.channel})`
    const movedMessage = `${header}\n${message.member} | ${msgDate}\n\n${message.content}`

    const files = message.attachments.map((file) => file.proxyURL)

    await channel.send({
      content: movedMessage,
      files,
      embeds: message.embeds,
    })

    await message.delete()
  }
}
