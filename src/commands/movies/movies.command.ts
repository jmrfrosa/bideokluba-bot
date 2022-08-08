import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInterface, CommandRunnerListType } from '@typings/command.type'
import { RunnerHandler } from '../subcommand.handler'
import { CreateMovieRunner } from './subcommands/create-movie.runner'
import { VoteMovieRunner } from './subcommands/vote-movie.runner'

export enum MovieCommandNames {
  MOVIES_CMD = 'filmes',
  MOVIE_CREATE_SCMD = 'criar',
  IMDB_URL_OPT = 'link_imdb',
  CURATOR_OPT = 'curator',
  MOVIE_VOTE_SCMD = 'votar',
  MOVIE_OPT = 'id_filme',
  START_DATE_OPT = 'data_inicial',
  END_DATE_OPT = 'data_final',
}

const subcommandRunners: CommandRunnerListType = {
  [MovieCommandNames.MOVIE_CREATE_SCMD]: CreateMovieRunner,
  [MovieCommandNames.MOVIE_VOTE_SCMD]: VoteMovieRunner,
}

export const MoviesCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName(MovieCommandNames.MOVIES_CMD)
    .setDescription('Criar, gerir ou verificar o estado da lista de filmes')
    .addSubcommand((subcmdCreate) =>
      subcmdCreate
        .setName(MovieCommandNames.MOVIE_CREATE_SCMD)
        .setDescription('Adicionar um novo filme à lista')
        .addStringOption((optImdbUrl) =>
          optImdbUrl
            .setName(MovieCommandNames.IMDB_URL_OPT)
            .setDescription('Link ou ID do filme no IMDB')
            .setRequired(true),
        )
        .addUserOption((optCurator) =>
          optCurator
            .setName(MovieCommandNames.CURATOR_OPT)
            .setDescription('Curador que escolheu este filme')
            .setRequired(false),
        ),
    )
    .addSubcommand((subcmdVote) =>
      subcmdVote
        .setName(MovieCommandNames.MOVIE_VOTE_SCMD)
        .setDescription(
          'Criar uma nova votação para discussão, datas são preenchidas automaticamente.',
        )
        .addStringOption((optMovie) =>
          optMovie
            .setName(MovieCommandNames.MOVIE_OPT)
            .setDescription('ID ou URL da mensagem no #info sobre o filme')
            .setRequired(false),
        )
        .addStringOption((optStartDate) =>
          optStartDate
            .setName(MovieCommandNames.START_DATE_OPT)
            .setDescription(
              'Data de início da votação ou dia actual caso ausente, formato DD/MM ou DD/MM/YYYY',
            )
            .setRequired(false),
        )
        .addStringOption((optEndDate) =>
          optEndDate
            .setName(MovieCommandNames.END_DATE_OPT)
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
