const { PollLoader } = require('../service/PollLoader.js');
const { fetchRole, fetchChannel, fetchMessage } = require('../util/common.js');
const { roles, channels } = require('../util/constants.js');

module.exports = {
  name: 'bot',
  description: 'Funcionalidades relacionadas com o bot.',
  usage: 'log / desactivar <poll_id> / activar <poll_id>',
  args: 1,
  roles: [],
  guildOnly: false,
  async execute (message, args) {
    switch (args[0]) {
      case 'log':
        const role = await fetchRole({ guild: message.guild, role: roles.botLog });

        message.member.roles.add(role);
        message.author.send(`Permissões adicionadas. Podes agora ter acesso ao registos da minha actividade em ${fetchChannel({ name: channels.bot })}`);
        break;
      case 'desactivar':
        if(!args[1]) return;

        if(!fetchPoll(args[1], message.channel)) {
          message.channel.send('Votação não encontrada!');
          return;
        }

        await PollLoader.archive(args[1]);
        message.channel.send(`Votação parada. Usa !bot activar ${args[1]} para reactivar.`);
        break;
      case 'activar':
        if(!args[1]) return;

        if(!fetchPoll(args[1], message.channel)) {
          message.channel.send('Votação não encontrada!');
          return;
        }

        await PollLoader.unarchive(args[1]);
        message.channel.send(`Votação reiniciada. Usa !bot desactivar ${args[1]} para parar novamente.`);
        break;
      default:
        break;
    }
  }
}

async function fetchPoll(id, channel) {
  const poll = await fetchMessage({ id, channel });

  return poll;
}
