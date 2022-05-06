import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface } from '../../typings/command.type'

export const AjudaCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Descrição dos comandos disponíveis'),
  run: async (interaction) => {
    await interaction.reply({
      content: 'Mensagem de ajuda',
      ephemeral: true,
    })
  },
}
