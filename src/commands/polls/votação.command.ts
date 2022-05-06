import { SlashCommandBuilder } from '@discordjs/builders'
import {
  CommandInterface,
  CommandRunnerListType,
} from '../../typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { MovieVoteRunner } from './subcommands/movie-vote.runner'

export enum VoteCommandNames {
  VOTE_CMD = 'votação',
  MOVIE_VOTE_SCMD = 'filme',
  START_DATE_OPT = 'data_inicial',
  END_DATE_OPT = 'data_final',
}

const subcommandRunners: CommandRunnerListType = {
  filme: MovieVoteRunner,
}

export const VotaçãoCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(VoteCommandNames.VOTE_CMD)
    .setDescription('Criar, gerir ou verificar o estado de votações')
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
