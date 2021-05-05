const { Poll } = require('../models/Poll.js');
const { fetchChannel } = require('../util/common.js');
const { defaultOptions, roles } = require('../util/constants.js');

module.exports = {
  name: 'votar',
  description: 'Criar uma votação para escolher o dia da discussão. `\[weekday]`\ varia de 1 (segunda) a 7 (domingo) e determina quais as datas fechadas.',
  args: 0,
  roles: [roles.active],
  usage: '[header] [channel] ...[emoji:option]',
  guildOnly: true,
  execute: async (message, args) => {
    const header = args[0] ? args[0].replaceAll('"', '') : 'Em que dia marcamos discussão?';

    const channel = args[1] ? fetchChannel({ name: args[1] }) : message.channel;

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    const optionArgs = args.slice(2);
    const options = optionArgs.length ?
      argsToOptions(optionArgs) : defaultOptions.map(opt => ({ ...opt, users: [] }));

    const reactions = options.map(o => o.emoji);

    const poll = new Poll({ options, channel, header });
    const body = poll.render();
    const sentMsg = await channel.send(body);

    const reactionPromises = reactions.map((reaction) => sentMsg.react(reaction));
    await Promise.all(reactionPromises);

    poll.save(sentMsg);
  }
}

function argsToOptions(args) {
  return args.map(a => {
    const [emoji, text] = a.split(':');

    return { emoji, text, users: [] };
  });
}
