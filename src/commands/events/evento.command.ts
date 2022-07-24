import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { InvalidCommandRunner } from '../invalid-command.runner'
import { CreateEventRunner } from './subcommands/create-event.runner'

const subcommandRunners: CommandRunnerListType = {
  criar: CreateEventRunner,
}

export const EventoCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName('evento')
    .setDescription('Criar e gerir eventos apresentados no #calendário')
    .addSubcommand((subcmdCriar) =>
      subcmdCriar
        .setName('criar')
        .setDescription('Criar um novo evento, adicionando-o ao calendário')
        .addStringOption((optTitle) =>
          optTitle
            .setName('title')
            .setDescription('Título do evento')
            .setRequired(true),
        )
        .addStringOption((optDate) =>
          optDate
            .setName('date')
            .setDescription('Data do evento no formato DD/MM ou DD/MM/YYYY')
            .setRequired(true),
        )
        .addStringOption((optChannel) =>
          optChannel
            .setName('channel')
            .setDescription(
              'Nome do canal onde criar o evento. Opcional, criado por defeito no canal da mensagem',
            )
            .setRequired(false),
        ),
    ),
  run: async (interaction) => {
    const receivedSubcommand = interaction.options.getSubcommand()
    const runner = subcommandRunners[receivedSubcommand] || InvalidCommandRunner

    await runner(interaction)
  },
}
