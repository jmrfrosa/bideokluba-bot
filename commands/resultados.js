const { client } = require('../util/client.js');
const { parseMessageId } = require("../util/common");
const { roles } = require('../util/constants.js');

module.exports = {
  name: 'resultados',
  description: 'Finalizar uma mensagem de voto. Devolve os resultados.',
  args: true,
  usage: '<poll_url>',
  guildOnly: true,
  execute(message, args) {
    const hasRole = message.member.roles.cache.some(role => ([roles.admin, roles.curator].includes(role.name)));

    if (!hasRole) {
      message.reply(`O teu pedido foi recusado. Pára de me assediar.`);
      return;
    }

    if (args.length < 1) {
      message.reply(`Uso incorrecto, lê as instruções!\n\n\`${prefix}${this.name} ${this.usage}\``);
      return;
    }

    const pollId = parseMessageId(args[0]);
    const poll = client.polls.get(pollId);
    const report = poll.report();

    poll.end();

    message.channel.send(report);
  }
}
