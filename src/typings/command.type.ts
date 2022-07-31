import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders'
import { ChatInputCommandInteraction } from 'discord.js'

export type CommandRunnerType = (interaction: ChatInputCommandInteraction) => Promise<void>

export type CommandRunnerListType = {
  [key: string]: CommandRunnerType
}

export interface CommandInterface {
  data:
    | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
    | SlashCommandSubcommandsOnlyBuilder
  run: CommandRunnerType
}
