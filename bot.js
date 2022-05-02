require('log-timestamp');
require('dotenv').config();

const process = require('process');
const { token } = require('./config');
const { client } = require('./util/client.js');
const { logger } = require('./util/logger.js');
const { PollLoader } = require('./service/PollLoader.js');
const { EventLoader } = require('./service/EventLoader.js');
const { InteractionHandler } = require('./service/InteractionHandler');
const { CommandHandler } = require('./service/CommandHandler');
const { ReactionHandler } = require('./service/ReactionHandler');
const { RssHandler } = require('./service/RssHandler');
const { WeekLoader } = require('./service/WeekLoader');
const { BirthdayHandler } = require('./service/BirthdayHandler');

CommandHandler.loadCommands();

client.once('ready', async () => {
  logger.info('Connected to Discord!')

  await PollLoader.load();
  await EventLoader.load();
  await WeekLoader.load();
  BirthdayHandler.start();
});

client.on('interactionCreate', async interaction => {
  InteractionHandler.handle(interaction);
});

client.on('message', message => {
  CommandHandler.handle(message);
});

client.on('messageDelete', async (deletedMessage) => {
  logger.trace("Message has been deleted!");
  const messageId = deletedMessage.id;

  PollLoader.unload(messageId);
  EventLoader.unload(messageId);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) return;

  ReactionHandler.add({ reaction, user });
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.partial) return;

  ReactionHandler.remove({ reaction, user });
});

process.on('uncaughtException', err => {
  logger.error(err);

  client.destroy();
});

process.on('unhandledRejection', err => {
  logger.error(err);

  client.destroy();
});

process.on('SIGTERM', signal => {
  logger.info(`Process ${process.pid} received exit signal ${signal}`);

  client.destroy();
});

process.on('SIGINT', signal => {
  logger.info(`Process ${process.pid} received exit signal ${signal}`);

  client.destroy();
});

client.login(token);
