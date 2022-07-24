import { EmbedBuilder } from '@discordjs/builders'
import { BirthdayHandler } from '@service/BirthdayHandler'
import { CommandRunnerType } from '@typings/command.type'

export const BirthdaysOffRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply()

  BirthdayHandler.stop()

  const embed = new EmbedBuilder()
    .setTitle('📨 Lembretes de Aniversário')
    .setDescription('❌ Os lembretes de aniversário foram desactivados.')
    .setTimestamp()

  await interaction.editReply({ embeds: [embed] })

  return
}
