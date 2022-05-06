import { config } from './config'
import { client } from './util/client'
import { logger } from './util/logger'
import { PollLoader } from './service/PollLoader'
import { EventLoader } from './service/EventLoader'
import { InteractionHandler } from './service/InteractionHandler'
// import { ReactionHandler } from './service/ReactionHandler'
import { WeekLoader } from './service/WeekLoader'
import { BirthdayHandler } from './service/BirthdayHandler'
import { CommandDeployer } from './service/CommandDeployer'

client.once('ready', async () => {
  logger.info('Connected to Discord!')

  await CommandDeployer.deploy()
  // await PollLoader.load()
  await EventLoader.load()
  await WeekLoader.load()
  BirthdayHandler.start()
})

client.on('interactionCreate', async (interaction) => {
  InteractionHandler.handle(interaction)
})

// client.on('messageCreate', message => {
//   CommandHandler.handle(message);
// });

client.on('messageDelete', async (deletedMessage) => {
  logger.trace('Message has been deleted!')
  const messageId = deletedMessage.id

  PollLoader.unload(messageId)
  EventLoader.unload(messageId)
})

// client.on('messageReactionAdd', async (reaction, user) => {
//   if (reaction.partial || user.partial) return;

//   ReactionHandler.add({ reaction, user });
// });

// client.on('messageReactionRemove', async (reaction, user) => {
//   if (reaction.partial || user.partial) return;

//   ReactionHandler.remove({ reaction, user });
// });

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
})

process.on('SIGINT', (signal) => {
  logger.info(`Process ${process.pid} received exit signal ${signal}`)

  client.destroy()
})

client.login(config.token)
