const { db } = require('../util/database.js');
const { client } = require('../util/client.js');
const { fetchMessage } = require('../util/common.js');

module.exports = {
  name: 'import_polls',
  async execute(guildName, channelName, ...pollIds) {
    const guild = client.guilds.cache.find(g => g.name === guildName);
    const channel = guild.channels.cache.find(c => c.name === channelName);

    console.log(`Found ${channel.name} in ${guild.name}`);

    const polls = await Promise.all(
      pollIds.map(async (id) => await fetchMessage({ id, channel, fromCache: false }))
    );

    console.log(`Fetched messages ${polls.map(p => p.id).join(', ')}`);

    polls.forEach(async poll => {
      const options = parseOptions(poll.content);

      let existingPoll = await db.findOne({ _id: poll.id });

      if (existingPoll) {
        console.log(`Poll ${poll.id} already exists, skipping`);
        return;
      }

      await db.insert({
        _id: poll.id,
        channel: channel.id,
        model: 'poll',
        options: options,
        header: 'Em que dia marcamos discussão?'
      });

      console.log(`Poll ${poll.id} was inserted into the database`);
    });
  }
}

function parseOptions(content) {
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

  const contentArray = content.split('\n');

  for(let i = 0; i < contentArray.length; i++) {
    options.forEach(opt => {
      const match = contentArray[i].match(opt.text);

      if(!match) return;

      const nextLineUsers = contentArray[i+1]?.match(/<@!?(\d+)>/g);

      if(nextLineUsers) {
        opt.users = nextLineUsers;
      }
    });
  }

  return options;
}
