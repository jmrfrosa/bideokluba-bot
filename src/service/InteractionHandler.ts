import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  InteractionType,
  ModalSubmitInteraction,
} from 'discord.js'
import { client } from '@util/client'
import { commandList } from '@commands/commands'
import { logger } from '@util/logger'

export class InteractionHandler {
  static async handle(interaction: Interaction) {
    if (interaction.type === InteractionType.ModalSubmit) {
      logger.trace('Detected modal interaction, %o', interaction.customId)
      this.handleModal(interaction)
    }

    if (interaction.isChatInputCommand()) {
      logger.trace('Detected chat input interaction, %o', interaction.commandId)
      this.handleCommand(interaction)
    }

    if (interaction.isButton()) {
      logger.trace('Detected button interaction, %o', interaction.customId)
      this.handleButton(interaction)
    }
  }

  static async handleCommand(commandInteraction: ChatInputCommandInteraction) {
    const command = commandList.find((c) => c.data.name === commandInteraction.commandName)

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

    logger.trace('Handling button for message: %o', messageId)

    const event = client.events?.get(messageId)
    const poll = client.polls?.get(messageId)

    if (event) {
      logger.trace('Found event for interaction %o!', buttonInteraction.customId)
      await event.handleOptionChoice(buttonInteraction)
    } else if (poll) {
      logger.trace('Found poll for interaction %o!', buttonInteraction.customId)
      await poll.handleOptionChoice(buttonInteraction)
    } else {
      await buttonInteraction.deferUpdate()
    }
  }

  static async handleModal(modalInteraction: ModalSubmitInteraction) {
    if (!modalInteraction.isFromMessage()) return

    await modalInteraction.deferUpdate()

    const messageId = modalInteraction.message.id

    const event = client.events?.get(messageId || '')

    if (event) {
      event.handleModalSubmission(modalInteraction)
    }
  }
}
