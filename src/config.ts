import * as path from 'path'

type configType = {
  appPath: string
  prefix: string
  token: string
  omdbToken?: string
  dbPath: string
  guildId: string
  applicationId: string
}

const appPath = path.resolve(__dirname)

export const config: configType = {
  appPath,
  prefix: '!',
  token: process.env.BOT_TOKEN || 'unknown',
  omdbToken: process.env.OMDB_TOKEN || 'unknown',
  dbPath: path.join(appPath, '../db/datastore.db'),
  guildId: process.env.GUILD_ID || '822532538466566185',
  applicationId: process.env.APPLICATION_ID || '822610005147779082',
}
