import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  User,
} from 'discord.js'
import { client } from '../util/client'
import { commandList } from '../commands/commands'
import { logger } from '../util/logger'
import { EventOptionKeys } from '../typings/event.type'
import { Event } from '../models/Event'

export class InteractionHandler {
  static async handle(interaction: Interaction) {
    if (interaction.isCommand()) {
      this.handleCommand(interaction)
    }

    if (interaction.isButton()) {
      this.handleButton(interaction)
    }
  }

  static async handleCommand(commandInteraction: CommandInteraction) {
    const command = commandList.find(
      (c) => c.data.name === commandInteraction.commandName,
    )

    if (!command) {
      logger.error(
        'InteractionHandler#handle: interaction was received but command was not found. %o',
        commandInteraction,
      )
      return
    }

    await command.run(commandInteraction)
  }

  static async handleButton(buttonInteraction: ButtonInteraction) {
    const messageId = buttonInteraction.message.id

    const event = client.events?.get(messageId)

    if (event) {
      const { user, customId } = buttonInteraction as {
        user: User
        customId: EventOptionKeys
      }
      const state = Event.options[customId]

      if (!state) {
        logger.error(
          'InteractionHandler#handleButton: Event button interaction received for unknown state: %o',
          buttonInteraction,
        )
        return
      }

      event.updateUser({ user, state })
    }

    await buttonInteraction.deferUpdate()
  }
}
