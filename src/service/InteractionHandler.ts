import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
} from 'discord.js'
import { client } from '@util/client'
import { commandList } from '@commands/commands'
import { logger } from '@util/logger'

export class InteractionHandler {
  static async handle(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
      this.handleCommand(interaction)
    }

    if (interaction.isButton()) {
      this.handleButton(interaction)
    }
  }

  static async handleCommand(commandInteraction: ChatInputCommandInteraction) {
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
    const poll = client.polls?.get(messageId)

    if (event) {
      event.handleOptionChoice(buttonInteraction)
    }

    if (poll) {
      poll.handleOptionChoice(buttonInteraction)
    }

    await buttonInteraction.deferUpdate()
  }
}
