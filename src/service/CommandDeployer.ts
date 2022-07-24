import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types'
import { commandList } from '@commands/commands'
import { rest, guildRoute } from '@util/client'
import { logger } from '@util/logger'

export class CommandDeployer {
  static async deploy() {
    const jsonCommands: RESTPostAPIApplicationCommandsJSONBody[] = []

    for (const command of commandList) {
      jsonCommands.push(command.data.toJSON())
    }

    await rest
      .put(guildRoute, { body: jsonCommands })
      .then(() =>
        logger.info('Commands were successfully registered in Discord'),
      )
      .catch((e) => logger.error(e))
  }
}
