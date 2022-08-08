import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  InteractionType,
  ModalSubmitInteraction,
} from 'discord.js'
import { commandList } from '@commands/commands'
import { logger } from '@util/logger'
import { Movie } from '@models/Movie'
import { Poll } from '@models/Poll'
import { Event } from '@models/Event'
import { entityCache } from './CacheService'

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

    logger.info('Handling button for message: %o', messageId)

    const entity = await entityCache.find(messageId)

    if (entity instanceof Event) {
      logger.info('Found event for interaction %o!', buttonInteraction.customId)
      await entity.handleOptionChoice(buttonInteraction)
    } else if (entity instanceof Poll) {
      logger.info('Found poll for interaction %o!', buttonInteraction.customId)
      await entity.handleOptionChoice(buttonInteraction)
    } else if (entity instanceof Movie) {
      logger.info('Found movie for interaction %o!', buttonInteraction.customId)
      await entity.handleOptionChoice(buttonInteraction)
    } else {
      await buttonInteraction.reply({
        content: 'O post com que tentaste interagir já não está disponível.',
        ephemeral: true,
      })
    }
  }

  static async handleModal(modalInteraction: ModalSubmitInteraction) {
    if (!modalInteraction.isFromMessage()) return

    await modalInteraction.deferUpdate()

    const messageId = modalInteraction.message.id

    const entity = await entityCache.find(messageId)

    if (entity instanceof Event) {
      await entity.handleModalSubmission(modalInteraction)
    } else if (entity instanceof Movie) {
      await entity.handleModalSubmission(modalInteraction)
    }
  }
}
