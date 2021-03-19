let options = [
  { id: 1     , text: 'Segunda'       , emoji: '2️⃣', users: [] },
  { id: 2     , text: 'Terça'         , emoji: '3️⃣', users: [] },
  { id: 3     , text: 'Quarta'        , emoji: '4️⃣', users: [] },
  { id: 4     , text: 'Quinta'        , emoji: '5️⃣', users: [] },
  { id: 5     , text: 'Sexta'         , emoji: '6️⃣', users: [] },
  { id: 6     , text: 'Sábado'        , emoji: '7️⃣', users: [] },
  { id: 7     , text: 'Domingo'       , emoji: '8️⃣', users: [] },
  { id: 'next', text: 'Próxima semana', emoji: '⏭️', users: [] }
]

const validReactions = options.map(o => o.emoji);

module.exports = {
  name: 'vote',
  description: 'Criar uma votação para escolher o dia da discussão',
  args: false,
  guildOnly: true,
  execute: async (message, _args) => {
    const weekday = convertToWeekday(message.createdAt);
    const body = renderTable(weekday);

    const sentMsg = await message.channel.send(body);
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

function convertToWeekday(date) {
  let day = date.getDay();

  return day === 0 ? 7 : day;
}

function isEarlier(day, currentDay) {
  return day < currentDay
}
