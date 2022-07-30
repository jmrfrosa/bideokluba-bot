import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { InvalidCommandRunner } from '../invalid-command.runner'
import { BirthdaysOffRunner } from './subcommands/birthdays/birthdays-off.runner'
import { BirthdaysOnRunner } from './subcommands/birthdays/birthdays-on.runner'
import { ViewBirthdaysRunner } from './subcommands/birthdays/view-birthdays.runner'

const subcommandRunners: CommandRunnerListType = {
  ligar: BirthdaysOnRunner,
  desligar: BirthdaysOffRunner,
  listar: ViewBirthdaysRunner,
}

export const AniversáriosCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName('aniversários')
    .setDescription('Gerir e verificar a lista de aniversários')
    .addSubcommand((subcmdLigar) =>
      subcmdLigar
        .setName('ligar')
        .setDescription('Activar os lembretes de aniversário'),
    )
    .addSubcommand((subcmdDesligar) =>
      subcmdDesligar
        .setName('desligar')
        .setDescription('Desactivar os lembretes de aniversário'),
    )
    .addSubcommand((subcmdListar) =>
      subcmdListar
        .setName('listar')
        .setDescription('Ver todos os aniversários registados'),
    ),
  run: async (interaction) => {
    const receivedSubcommand = interaction.options.getSubcommand()
    const runner = subcommandRunners[receivedSubcommand] || InvalidCommandRunner

    await runner(interaction)
  },
}
