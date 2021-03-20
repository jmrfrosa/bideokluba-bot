const neededRole = 'Fundador';

let options = [
  { id: 1     , text: 'Segunda'       , emoji: '2️⃣' },
  { id: 2     , text: 'Terça'         , emoji: '3️⃣' },
  { id: 3     , text: 'Quarta'        , emoji: '4️⃣' },
  { id: 4     , text: 'Quinta'        , emoji: '5️⃣' },
  { id: 5     , text: 'Sexta'         , emoji: '6️⃣' },
  { id: 6     , text: 'Sábado'        , emoji: '7️⃣' },
  { id: 7     , text: 'Domingo'       , emoji: '8️⃣' },
  { id: 'next', text: 'Próxima semana', emoji: '⏭️' }
]

options.map(opt => opt.users = []);

const validReactions = options.map(o => o.emoji);

module.exports = {
  name: 'votar',
  description: 'Criar uma votação para escolher o dia da discussão. `\[weekday]`\ varia de 1 (segunda) a 7 (domingo) e determina quais as datas fechadas.',
  args: true,
  usage: '[channel] [weekday]',
  guildOnly: true,
  execute: async (message, args) => {
    const hasRole = message.member.roles.cache.some(role => role.name === neededRole);

    if (!hasRole) {
      message.reply(`O teu pedido foi recusado. Pára de me assediar.`);
      return;
    }

    const channel = args[0] ? findChannel(args[0], message.client) : message.channel;
    const weekday = args[1] ? (~~parseInt(args[1]) % 8) : convertToWeekday(message.createdAt);

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    const body = renderTable(weekday);

    const sentMsg = await channel.send(body);
    const reactionPromises = validReactions.map((reaction) => sentMsg.react(reaction));
    await Promise.all(reactionPromises);

    const reactionCollector = sentMsg.createReactionCollector(reactionFilter, { dispose: true });

    reactionCollector.on('collect', (r, u) => {
      const opt = findOption(r);

      addUser(opt, u);
      sentMsg.edit(renderTable(weekday));
    });
    reactionCollector.on('remove', (r, u) => {
      const opt = findOption(r);

      removeUser(opt, u);
      sentMsg.edit(renderTable(weekday));
    });
  }
}

function renderTable(weekday) {
  const header = 'Em que dia marcamos discussão?';

  const table = options.reduce((msg, option) => {
    const { id, text, emoji, users } = option;

    const graphic = isEarlier(id, weekday) ? '❌' : emoji;
    const userList = users.reduce((text, user, idx) => (
      `${text}${user}${idx+1 !== users.length ? ', ' : '' }`
    ), '');

    return `${msg}${graphic} – ${text}${users.length ? `\n    ${userList}` : ''}\n`
  }, '');

  return `${header}\n${table}`;
}

function findOption(reaction) {
  const { name } = reaction.emoji;

  return options.find(o => o.emoji === name);
}

function addUser(option, user) {
  option.users.push(user);
}

function removeUser(option, user) {
  option.users = option.users.filter(u => u.username !== user.username);
}

function reactionFilter(reaction, _user) {
  return validReactions.includes(reaction.emoji.name);
}

function findChannel(channelName, client) {
  return client.channels.cache.find(ch => ch.name === channelName);
}

function convertToWeekday(date) {
  let day = date.getDay();

  return day === 0 ? 7 : day;
}

function isEarlier(day, currentDay) {
  return day < currentDay
}
