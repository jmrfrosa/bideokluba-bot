require('dotenv').config();

const { token } = require('./config');
const { client } = require('./util/client.js');
const { PollLoader } = require('./service/PollLoader.js');
const { CommandHandler } = require('./service/CommandHandler');

CommandHandler.loadCommands();

client.once('ready', async () => {
  console.log('Connected to Discord!');

  PollLoader.load();
});

client.on('message', message => {
  CommandHandler.handle(message);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) return;

  const messageId = reaction.message.id;
  const runningPoll = client.polls.get(messageId);
  if(runningPoll) await runningPoll.addUser(user, reaction);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.partial) return;

  const messageId = reaction.message.id;
  const runningPoll = client.polls.get(messageId);
  if(runningPoll) await runningPoll.removeUser(user, reaction);
});

client.login(token);
