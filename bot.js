require('log-timestamp');
require('dotenv').config();

const { token } = require('./config');
const { client } = require('./util/client.js');
const { PollLoader } = require('./service/PollLoader.js');
const { EventLoader } = require('./service/EventLoader.js');
const { InteractionHandler } = require('./service/InteractionHandler');
const { CommandHandler } = require('./service/CommandHandler');
const { ReactionHandler } = require('./service/ReactionHandler');
const { RssHandler } = require('./service/RssHandler');
const { WeekLoader } = require('./service/WeekLoader');

CommandHandler.loadCommands();

client.once('ready', async () => {
  console.log('Connected to Discord!');

  await PollLoader.load();
  await EventLoader.load();
  await WeekLoader.load();
  await RssHandler.start();
});

client.on('interactionCreate', async interaction => {
  InteractionHandler.handle(interaction);
});

client.on('message', message => {
  CommandHandler.handle(message);
});

client.on('messageDelete', async (deletedMessage) => {
  console.log("Message has been deleted!");
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

process.on('SIGTERM', signal => {
  console.log(`Process ${process.pid} received a SIGTERM signal`)
  process.exit(0)
})

process.on('SIGINT', signal => {
  console.log(`Process ${process.pid} has been interrupted`)
  process.exit(0)
})

client.login(token);
