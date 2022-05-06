import { CommandRunnerType } from '../typings/command.type'
import { logger } from '../util/logger'

export const InvalidCommandRunner: CommandRunnerType = async (interaction) => {
  try {
    await interaction.reply({
      content:
        'O comando não foi reconhecido, por favor verifica o texto e tenta novamente',
      ephemeral: true,
    })
  } catch (error) {
    logger.error(error)
  }
}
