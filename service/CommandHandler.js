const fs = require('fs');
const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { prefix } = require('../config.js');
const { common } = require('../util/constants.js');

class CommandHandler {
  static loadCommands() {
    client.commands = new Collection();

    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    commandFiles.forEach(file => {
      const command = require(`../commands/${file}`);

      client.commands.set(command.name, command);
    });
  }

  static handle(message) {
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
  }
}

module.exports = {
  CommandHandler
}
