import { config } from './config'
import { client } from '@util/client'
import { logger } from '@util/logger'
import { PollLoader } from '@service/loaders/PollLoader'
import { EventLoader } from '@service/loaders/EventLoader'
import { InteractionHandler } from '@service/InteractionHandler'
import { BirthdayHandler } from '@service/BirthdayHandler'
import { CommandDeployer } from '@service/CommandDeployer'
import { dbInstance } from '@service/DbService'

client.once('ready', async () => {
  await dbInstance.connect()

  logger.info('Connected to Discord!')

  await CommandDeployer.deploy()
  BirthdayHandler.start()
})

client.on('interactionCreate', async (interaction) => {
  InteractionHandler.handle(interaction)
})

client.on('messageDelete', async (deletedMessage) => {
  logger.trace('Message has been deleted!')
  const messageId = deletedMessage.id

  PollLoader.unload(messageId)
  EventLoader.unload(messageId)
})

process.on('uncaughtException', (err) => {
  logger.error(err)

  client.destroy()
})

process.on('unhandledRejection', (err) => {
  logger.error(err)

  client.destroy()
})

process.on('SIGTERM', (signal) => {
  logger.info(`Process ${process.pid} received exit signal ${signal}`)

  client.destroy()

  process.exit()
})

process.on('SIGINT', (signal) => {
  logger.info(`Process ${process.pid} received exit signal ${signal}`)

  client.destroy()

  process.kill(process.pid, 'SIGTERM')
})

process.on('exit', () => {
  console.log('Shutting down bot. Goodbye!')
})

client.login(config.token)
