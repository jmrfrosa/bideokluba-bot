import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { MoveMessagesRunner } from './subcommands/move-messages.runner'

export enum AdminCommandNames {
  ADMIN_CMD = 'admin',
  MOVE_SCMD = 'mover',
  CHANNEL_OPT = 'canal',
  MESSAGES_OPT = 'mensagens',
}

const subcommandRunners: CommandRunnerListType = {
  mover: MoveMessagesRunner,
}

export const AdminCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(AdminCommandNames.ADMIN_CMD)
    .setDescription('Comandos apenas para administradores')
    .addSubcommand((subcmdMover) =>
      subcmdMover
        .setName(AdminCommandNames.MOVE_SCMD)
        .setDescription('Mover uma ou mais mensagens de um canal para outro')
        .addChannelOption((optChannel) =>
          optChannel
            .setName(AdminCommandNames.CHANNEL_OPT)
            .setDescription('Novo canal para onde mover as mensagens')
            .addChannelType(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((optMessages) =>
          optMessages
            .setName(AdminCommandNames.MESSAGES_OPT)
            .setDescription(
              'Lista de IDs de mensagens a mover, separados por espaço',
            )
            .setRequired(true),
        ),
    ),
  run: async (interaction) => {
    const receivedSubcommand = interaction.options.getSubcommand()

    await RunnerHandler({
      commandName: receivedSubcommand,
      runnerList: subcommandRunners,
      interaction,
    })
  },
}
