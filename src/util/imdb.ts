import { config } from '../config'

type OMDBQueryOptions = {
  /**
   * A valid IMDb ID (e.g. tt1285016)
   */
  i?: string
  /**
   * Movie title to search for
   */
  t?: string
  /**
   * Type of result to return
   */
  type?: 'movie' | 'series' | 'episode'
  /**
   * Year of release.
   */
  y?: string
  /**
   * Return short or full plot.
   */
  plot?: 'short' | 'full'
  /**
   * The data type to return
   */
  r?: 'json' | 'xml'
  /**
   * JSONP callback name
   */
  callback?: string
  /**
   * API version (reserved for future use)
   */
  v?: string
}

export type OMDBMovieResponse = {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: {
    Source: string
    Value: string
  }[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

export class OMDBClient {
  private static baseUrl = 'http://www.omdbapi.com/' as const
  private readonly apiKey: string

  constructor(apiKey = config.omdbToken) {
    if (!apiKey) throw new Error('Missing OMDB API key')

    this.apiKey = apiKey
  }

  async findById(id: string) {
    const url = this.buildUrl({ i: id, plot: 'short', r: 'json' })

    try {
      const response = await fetch(url)
      return (await response.json()) as OMDBMovieResponse
    } catch (err) {
      console.error(`Error fetching data for movie ${id}`, err)
    }
  }

  async findByTitle(title: string) {
    const url = this.buildUrl({ t: title, plot: 'short', r: 'json' })

    try {
      const response = await fetch(url)
      return (await response.json()) as OMDBMovieResponse
    } catch (err) {
      console.error(`Error fetching data for movie ${title}`, err)
    }
  }

  private buildUrl(queryOptions: OMDBQueryOptions) {
    const url = new URL(OMDBClient.baseUrl)

    url.searchParams.append('apiKey', this.apiKey)

    for (const [k, v] of Object.entries(queryOptions)) {
      url.searchParams.append(k, v)
    }

    return url
  }
}

export const omdbClient = new OMDBClient()
