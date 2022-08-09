import { EmbedBuilder } from '@discordjs/builders'
import { BirthdayHandler } from '@service/BirthdayHandler'
import { CommandRunnerType } from '@typings/command.type'

export const BirthdaysOnRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply()

  BirthdayHandler.start()

  const embed = new EmbedBuilder()
    .setTitle('📨 Lembretes de Aniversário')
    .setDescription(
      '✅ Os lembretes de aniversário foram activados!\n\n' +
        'O bideobot garante que nunca mais nos esqueceremos destas datas importantes ao automatizar de forma fria e eficiente este processo moroso.',
    )
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })
}
