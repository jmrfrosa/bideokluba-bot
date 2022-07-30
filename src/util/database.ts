import { config } from '../config'
import { MongoClient } from 'mongodb'

export const dbClient = new MongoClient(config.dbUrl)
