const { prefix } = require('../config');

module.exports = {
  name: 'help',
  description: 'Mostrar todos os comandos do bot',
  args: false,
  guildOnly: false,
  execute(message, _args) {
    const { commands } = message.client;

    let helpMessage = '_Comandos disponíveis:_\n';

    helpMessage += commands.reduce((msg, cmd) => (
      `${msg}\n**${prefix}${cmd.name}**: ${cmd.description}${cmdUsage(cmd)}`
    ), '');

    message.channel.send(helpMessage);
  }
}

function cmdUsage(command) {
  if(!command.usage) return '';

  return `\n   Exemplo: \`\`\`${prefix}${command.name} ${command.usage}\`\`\``
}
