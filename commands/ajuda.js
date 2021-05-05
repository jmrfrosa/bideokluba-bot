const { prefix } = require('../config');

module.exports = {
  name: 'ajuda',
  description: 'Mostrar todos os comandos do bot',
  args: 0,
  roles: [],
  guildOnly: false,
  execute(message, _args) {
    const { commands } = message.client;

    let helpMessage = '_Comandos disponíveis:_\n' +
      'Nota: \`<...>\` signifca um argumento obrigatório e \`[...]\` um argumento opcional';

    helpMessage += commands.reduce((msg, cmd) => (
      `${msg}\n**${prefix}${cmd.name}**: ${cmd.description}${cmdUsage(cmd)}`
    ), '');

    message.channel.send(helpMessage);
  }
}

function cmdUsage(command) {
  if(!command.usage) return '';

  return `\n   Exemplo: \`${prefix}${command.name} ${command.usage}\``
}
