import Datastore from 'nedb-promises'
import { config } from '../config'

export const db = Datastore.create(config.dbPath)
