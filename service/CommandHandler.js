const { Collection } = require('discord.js');
const { client } = require('../util/client.js');
const { prefix } = require('../config.js');
const { common } = require('../util/constants.js');
const { hasRole } = require('../util/common.js');
const { loadCommandsFromFilesystem } = require('../util/commands.js');

class CommandHandler {
  static loadCommands() {
    client.commands = new Collection();

    loadCommandsFromFilesystem().forEach(file => {
      const command = require(`../commands/${file}`);

      client.commands.set(command.name, command);
    });
  }

  static handle(message) {
    if(!message?.content || !message.content.startsWith(prefix) || message.author.bot) return;

    const args = CommandHandler.sanitizeArgs(message.content);
    const commandName = args.shift().toLowerCase();

    if(!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    if(command.roles.length && !hasRole(message.member, command.roles)) {
      message.reply(`O teu pedido foi recusado. Pára de me assediar.`);
      return;
    }

    if(args.length < command.args) {
      message.reply(`Uso incorrecto, lê as instruções!\n\n\`${prefix}${command.name} ${command.usage}\``);
      return;
    }

    try {
      command.execute(message, args);
    } catch(error) {
      console.error(error);
    }
  }

  static sanitizeArgs(text) {
    if(!text) return '';

    return text.replace(/[‟“”]/g, '"')
               .slice(prefix.length)
               .trim()
               .match(common.cmdRegex);
  }
}

module.exports = {
  CommandHandler
}
