import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType, PermissionFlagsBits } from 'discord.js'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { MoveMessagesRunner } from './subcommands/admin/move-messages.runner'
import { RenderRunner } from './subcommands/admin/render.runner'
import { AnnouncementRunner } from './subcommands/admin/announcement.runner'

export enum AdminCommandNames {
  ADMIN_CMD = 'admin',
  MOVE_SCMD = 'mover',
  CHANNEL_OPT = 'canal',
  MESSAGES_OPT = 'mensagens',
  RENDER_SCMD = 'render',
  ENTITY_OPT = 'entidade',
  ANNOUNCEMENT_SCMD = 'anúncio',
}

const subcommandRunners: CommandRunnerListType = {
  [AdminCommandNames.MOVE_SCMD]: MoveMessagesRunner,
  [AdminCommandNames.RENDER_SCMD]: RenderRunner,
  [AdminCommandNames.ANNOUNCEMENT_SCMD]: AnnouncementRunner,
}

export const AdminCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(AdminCommandNames.ADMIN_CMD)
    .setDescription('Comandos apenas para administradores')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcmdMover) =>
      subcmdMover
        .setName(AdminCommandNames.MOVE_SCMD)
        .setDescription('Mover uma ou mais mensagens de um canal para outro')
        .addChannelOption((optChannel) =>
          optChannel
            .setName(AdminCommandNames.CHANNEL_OPT)
            .setDescription('Novo canal para onde mover as mensagens')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((optMessages) =>
          optMessages
            .setName(AdminCommandNames.MESSAGES_OPT)
            .setDescription('Lista de IDs de mensagens a mover, separados por espaço')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcmdRender) =>
      subcmdRender
        .setName(AdminCommandNames.RENDER_SCMD)
        .setDescription('Renderizar novamente uma entidade (evento, votação, semana)')
        .addStringOption((optEntity) =>
          optEntity
            .setName(AdminCommandNames.ENTITY_OPT)
            .setDescription('ID da mensagem da entidade')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcmdAnnouncement) =>
      subcmdAnnouncement
        .setName(AdminCommandNames.ANNOUNCEMENT_SCMD)
        .setDescription('Lançar anúncios de lançamento'),
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
