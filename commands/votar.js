const { Poll } = require('../models/Poll.js');
const { fetchChannel } = require('../util/common.js');
const { roles } = require('../util/constants.js');

const defaultOptions = [
  { id: 1     , text: 'Segunda'       , emoji: '2️⃣' },
  { id: 2     , text: 'Terça'         , emoji: '3️⃣' },
  { id: 3     , text: 'Quarta'        , emoji: '4️⃣' },
  { id: 4     , text: 'Quinta'        , emoji: '5️⃣' },
  { id: 5     , text: 'Sexta'         , emoji: '6️⃣' },
  { id: 6     , text: 'Sábado'        , emoji: '7️⃣' },
  { id: 7     , text: 'Domingo'       , emoji: '8️⃣' },
  { id: 'next', text: 'Próxima semana', emoji: '⏭️' }
]

const validReactions = defaultOptions.map(o => o.emoji);

module.exports = {
  name: 'votar',
  description: 'Criar uma votação para escolher o dia da discussão. `\[weekday]`\ varia de 1 (segunda) a 7 (domingo) e determina quais as datas fechadas.',
  args: true,
  usage: '[channel]',
  guildOnly: true,
  execute: async (message, args) => {
    const hasRole = message.member.roles.cache.some(role => role.name === roles.admin);

    if (!hasRole) {
      message.reply(`O teu pedido foi recusado. Pára de me assediar.`);
      return;
    }

    const channel = args[0] ? fetchChannel({ name: args[0] }) : message.channel;

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    let options = defaultOptions.map(opt => ({ ...opt, users: [] }));

    const poll = new Poll(options, channel, { header: 'Em que dia marcamos discussão?' });
    const body = poll.render();
    const sentMsg = await channel.send(body);

    const reactionPromises = validReactions.map((reaction) => sentMsg.react(reaction));
    await Promise.all(reactionPromises);

    poll.save(sentMsg);
  }
}
