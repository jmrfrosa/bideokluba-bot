import * as imdb from 'imdb-api'
import { config } from '../config'

export const imdbClient = new imdb.Client({ apiKey: config.omdbToken })
