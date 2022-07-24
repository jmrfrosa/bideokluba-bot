import { MessageActionRow, MessageButton, Constants, Message } from 'discord.js'
import { CommandRunnerType } from '@typings/command.type'
import { client } from '@util/client'
import { parseMessageId } from '@util/common'
import { VoteCommandNames } from '../votação.command'

export const ResultsRunner: CommandRunnerType = async (interaction) => {
  const reply = await interaction.deferReply({ fetchReply: true })
  const replyId = reply.id

  const idOrUrl = interaction.options.getString(
    VoteCommandNames.VOTE_ID_OPT,
    true,
  )

  const pollId = parseMessageId(idOrUrl)
  const poll = client.polls?.get(pollId)

  if (!poll) {
    await interaction.editReply(
      'Esta votação não existe ou não se encontra activa!',
    )
    return
  }

  const report = poll.report()

  const components = [buildButtonComponents(replyId)]

  const reportMsg = (await interaction.editReply(report)) as Message<boolean>
  await interaction.followUp({
    content: 'Queres terminar esta votação?',
    ephemeral: true,
    components,
  })

  const collector = interaction.channel?.createMessageComponentCollector({
    filter: (i) => i.customId.endsWith(replyId),
    time: 15000,
  })
  collector?.on('collect', async (i) => {
    if (i.customId.startsWith('approve')) {
      poll.end()
      await reportMsg.edit(`A votação terminou.\n${reportMsg.content}`)
      return
    }
  })
}

function buildButtonComponents(uniqueId: string) {
  const buttonRow = new MessageActionRow()
  const buttons = [
    {
      customId: `approve-${uniqueId}`,
      emoji: '👍',
      style: Constants.MessageButtonStyles.SECONDARY,
    },
    {
      customId: `reject-${uniqueId}`,
      emoji: '👎',
      style: Constants.MessageButtonStyles.SECONDARY,
    },
  ].map((btn) =>
    new MessageButton()
      .setCustomId(btn.customId)
      .setEmoji(btn.emoji)
      .setStyle(btn.style),
  )

  buttonRow.addComponents(buttons)

  return buttonRow
}
