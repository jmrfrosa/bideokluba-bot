require('dotenv').config();

const fs = require('fs');
const { Collection } = require('discord.js');
const { prefix, token } = require('./config');
const { db } = require('./util/database.js');
const { client } = require('./util/client.js');
const { Poll } = require('./models/Poll');
const { common } = require('./util/constants');

client.commands = new Collection();
client.polls = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
});

client.once('ready', async () => {
  console.log('Connected to Discord!');

  console.log('Fetching existing polls...');
  const polls = await db.find({ model: 'poll' });

  console.log(`Found ${polls.length} polls running.`);

  polls.forEach(async (p) => {
    const poll = new Poll(p.options, p.channel, { header: p.header, message: p._id });

    await poll.hydrate();

    client.polls.set(p._id, poll);

    console.log(`Poll ${p._id} hydrated and added to reaction listeners.`);
  });
});

client.on('message', message => {
  if(!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().match(common.cmdRegex);
  const commandName = args.shift().toLowerCase();

  if(!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  try {
    command.execute(message, args);
  } catch(error) {
    console.error(error);
  }
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
