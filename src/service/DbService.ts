import { MongoClient, Db } from 'mongodb'
import { config } from '../config'
import { dbClient } from '../util/database'
import { logger } from '../util/logger'

export class DbService {
  dbClient: MongoClient
  db: Db = dbClient.db()

  constructor(client: MongoClient) {
    this.dbClient = client
  }

  async connect() {
    logger.info(`Connecting to DB: ${config.dbUrl}`)
    await this.dbClient.connect()
  }
}

export const dbInstance = new DbService(dbClient)
