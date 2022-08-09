import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { ResultsRunner } from './subcommands/results.runner'

export enum VoteCommandNames {
  VOTE_CMD = 'votação',
  MOVIE_VOTE_SCMD = 'filme',
  VOTE_RESULTS_SCMD = 'resultados',
  START_DATE_OPT = 'data_inicial',
  END_DATE_OPT = 'data_final',
  VOTE_ID_OPT = 'link_votação',
}

const subcommandRunners: CommandRunnerListType = {
  [VoteCommandNames.VOTE_RESULTS_SCMD]: ResultsRunner,
}

export const VotaçãoCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(VoteCommandNames.VOTE_CMD)
    .setDescription('Criar, gerir ou verificar o estado de votações')
    .addSubcommand((subcmdVoteResults) =>
      subcmdVoteResults
        .setName(VoteCommandNames.VOTE_RESULTS_SCMD)
        .setDescription('Verificar os resultados de uma votação anterior')
        .addStringOption((optVoteId) =>
          optVoteId
            .setName(VoteCommandNames.VOTE_ID_OPT)
            .setDescription('Link ou ID da mensagem de votação a verificar')
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
