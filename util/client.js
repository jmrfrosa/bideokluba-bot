const { token, clientId, guildId } = require('../config');
const { Client, Intents } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

const client = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  intents: [Intents.FLAGS.GUILDS]
});

const rest = new REST({ version: '9' }).setToken(token);
const guildRoute = Routes.applicationGuildCommands(clientId, guildId)

module.exports = {
  client,
  rest,
  guildRoute
}
