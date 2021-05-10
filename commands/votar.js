const { Poll } = require('../models/Poll.js');
const { fetchChannel } = require('../util/common.js');
const { roles, toEmoji } = require('../util/constants.js');
const { now, toDate, isDate } = require('../util/datetime.js');

module.exports = {
  name: 'votar',
  description: 'Criar uma votação. Suporta imensas opções! Perguntem-me simplesmente, é mais fácil.',
  args: 0,
  roles: [roles.active],
  usage: '[header] [channel] ...[emoji:option] / [data final] / [data inicial] [data final]',
  guildOnly: true,
  execute: async (message, args) => {
    const header = args[0] ? args[0].replaceAll('"', '') : 'Em que dia marcamos discussão?';

    const channel = args[1] ? fetchChannel({ name: args[1] }) : message.channel;

    if (!channel) {
      message.reply(`Não consegui encontrar esse canal! Escreve como está na barra lateral sff.`);
      return;
    }

    const optionArgs = args.slice(2);
    const options = argsToOptions(optionArgs);

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
  if (!args.length) {
    return optionsFromDates();
  }

  if (args.length === 1 && isDate(args[0])) {
    // We assume we have just received an end date
    return optionsFromDates({ endDate: toDate(args[0]) });
  }

  if (args.length === 2 && args.every(date => isDate(date))) {
    // We assume we have received a start + end date
    return optionsFromDates({ startDate: toDate(args[0]), endDate: toDate(args[1]) });
  }

  if (args.every(opt => opt.match(/:/))) {
    // We assume all args are options of the form emoji:text
    return args.map(a => {
      const [emoji, text] = a.split(':');
      const parsedText = text.replaceAll('"', '');

      return { emoji, text: parsedText, users: [] };
    });
  }
}

function optionsFromDates({ startDate = now(), endDate = now().add(10, 'day') } = {}) {
  const daysBetween = Math.min(
    Math.abs(endDate.diff(startDate, 'day')), 10
  );

  const options = Array(daysBetween).fill().map((_, day) => (
    {
      text: startDate.add(day, 'day').format('ddd, DD/MM'),
      emoji: toEmoji(String(day)),
      users: []
    }
  ));

  return [
    ...options,
    { text: 'Próxima semana', emoji: toEmoji('next'), users: [] }
  ]
}
