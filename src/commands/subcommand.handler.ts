import { ChatInputCommandInteraction } from 'discord.js'
import { CommandRunnerListType } from '@typings/command.type'
import { InvalidCommandRunner } from './invalid-command.runner'

type RunnerHandlerType = {
  commandName: string
  runnerList: CommandRunnerListType
  interaction: ChatInputCommandInteraction
}

export const RunnerHandler = async ({
  commandName,
  runnerList,
  interaction,
}: RunnerHandlerType) => {
  const runner = runnerList[commandName] || InvalidCommandRunner

  await runner(interaction)
}
