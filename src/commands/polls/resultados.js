const { client } = require('../util/client.js');
const { parseMessageId } = require("../util/common");
const { roles } = require('../util/constants.js');

const validReactions = ['👍', '👎'];

module.exports = {
  name: 'resultados',
  description: 'Finalizar uma mensagem de voto. Devolve os resultados.',
  args: 1,
  roles: [roles.active],
  usage: '<poll_url>',
  guildOnly: true,
  async execute(message, args) {
    const pollId = parseMessageId(args[0]);
    const poll = client.polls.get(pollId);

    if (!poll) {
      message.reply('Esta votação não existe ou não se encontra activa!');
      return;
    }

    const report = poll.report();

    const reportMsg = await message.channel.send(report);
    const removeMsg = await message.channel.send('Queres terminar esta votação?');

    const reactionPromises = validReactions.map((reaction) => removeMsg.react(reaction));
    await Promise.all(reactionPromises);

    const listener = removeMsg.createReactionCollector(reactionFilter, { time: 15000 });

    listener.on('collect', (reaction, _user) => {
      const { name } = reaction.emoji;

      switch (name) {
        case '👍':
          poll.end();
          removeMsg.edit('A votação foi terminada!');
          reportMsg.edit(`A votação terminou.\n${reportMsg.content}`);
          break;
        case '👎':
          break;
        default:
          break;
      }
    });

    listener.on('end', (_reaction, _user) => {
      removeMsg.delete();
    });
  }
}

function reactionFilter(reaction, _user) {
  return validReactions.includes(reaction.emoji.name);
}
