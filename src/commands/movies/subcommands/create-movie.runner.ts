import { imdb } from '@util/constants'
import { imdbClient } from '@util/imdb'
import { CommandRunnerType } from '@typings/command.type'
import { MovieCommandNames } from '../movies.command'
import { Movie } from '@models/Movie'

export const CreateMovieRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const imdbUrl = interaction.options.getString(MovieCommandNames.IMDB_URL_OPT, true)
  const curator = interaction.options.getUser(MovieCommandNames.CURATOR_OPT, false)

  const latestMovie = await Movie.latestMovie()

  const canCreate = !latestMovie || latestMovie.isDiscussed()

  if (!canCreate) {
    await interaction.editReply({
      content:
        'Erro a adicionar um novo filme: o último filme ainda não está marcado como discutido!',
    })
    return
  }

  const imdbId = getIdFromImdbUrl(imdbUrl)

  if (!imdbId) {
    await interaction.editReply({
      content: `Não consegui detectar um ID válido no link do IMDB que colocaste! Encontrei: ${imdbId}`,
    })
    return
  }

  const movieData = await fetchMovieData(imdbId)
  const movie = await Movie.createFromImdb(movieData, curator)

  const replyContent = movie
    ? `O teu filme ${movie.title} foi adicionado. Verifica o post aqui: ${movie.message.url}`
    : 'Ocorreu um problema ao adicionar o filme.'
  await interaction.editReply({ content: replyContent })
}

function getIdFromImdbUrl(url: string) {
  const matches = url.match(imdb.idRegex)

  if (!matches) return

  const [matchedStr, ..._additionalData] = matches

  return matchedStr
}

async function fetchMovieData(imdbId: string) {
  return await imdbClient.get({ id: imdbId })
}
