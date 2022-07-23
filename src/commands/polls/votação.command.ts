import { SlashCommandBuilder } from '@discordjs/builders'
import {
  CommandInterface,
  CommandRunnerListType,
} from '../../typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { MovieVoteRunner } from './subcommands/movie-vote.runner'
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
  [VoteCommandNames.MOVIE_VOTE_SCMD]: MovieVoteRunner,
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
    )
    .addSubcommand((subcmdMovieVote) =>
      subcmdMovieVote
        .setName(VoteCommandNames.MOVIE_VOTE_SCMD)
        .setDescription(
          'Criar uma nova votação para discussão, datas são preenchidas automaticamente.',
        )
        .addStringOption((optStartDate) =>
          optStartDate
            .setName(VoteCommandNames.START_DATE_OPT)
            .setDescription(
              'Data de início da votação ou dia actual caso ausente, formato DD/MM ou DD/MM/YYYY',
            )
            .setRequired(false),
        )
        .addStringOption((optEndDate) =>
          optEndDate
            .setName(VoteCommandNames.END_DATE_OPT)
            .setDescription(
              'Data final da votação ou 10 dias após data inicial caso ausente, formato DD/MM ou DD/MM/YYYY',
            )
            .setRequired(false),
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
