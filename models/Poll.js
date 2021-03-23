const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { fetchChannel, fetchMessage, setDifference } = require('../util/common.js');

class Poll {
  constructor(options, channel, { header = '', message = null }) {
    this.message = message;
    this.options = options;
    this.channel = channel;
    this.header  = header;
  }

  async fetch() {
    return db.findOne({ _id: this.message.id });
  }

  async save(message) {
    this.message = message;

    const poll = await db.insert({
      _id: this.message.id,
      channel: this.channel.id,
      model: 'poll',
      options: this.options,
      header: this.header
    });

    client.polls.set(message.id, this);

    return poll;
  }

  async end() {
    const { id } = this.message;

    client.polls.delete(id)
    await db.remove({ _id: id });

    console.log(`Poll ${id} was deleted.`);
  }

  async hydrate() {
    this.channel = await fetchChannel({ id: this.channel, fromCache: false });
    this.message = await fetchMessage({ id: this.message, channel: this.channel, fromCache: false });

    return this;
  }

  render() {
    const table = this.options.reduce((msg, option) => {
      const { text, emoji, users } = option;

      const userList = users.reduce((text, user, idx) => (
        `${text}${user}${idx+1 !== users.length ? ', ' : '' }`
      ), '');

      const stats = this.#optionStats(option);
      const statsText = `**${stats.numReacts} (${stats.percent}%)**`;
      const usersText = `\n    ${userList}`;

      return `${msg}${emoji} – ${text}${users.length ? ` - ${statsText}${usersText}` : ''}\n`
    }, '');

    return `${this.header}\n${table}`;
  }

  report() {
    const stats = this.options.map(opt => ({ opt, stat: this.#optionStats(opt) }));
    const topStats = stats.sort((a, b) => b.stat.numReacts - a.stat.numReacts).slice(0, 3);
    const [top1, top2, top3] = [topStats[0], topStats[1], topStats[2]];

    let excludedUsers = new Set(top2.opt.users.concat(top3.opt.users));
    excludedUsers = [...setDifference(excludedUsers, top1.opt.users)];

    const excludedText = excludedUsers.length ?
      `Votaram na 2º e 3º mas não no vencedor: ${excludedUsers.join(', ')}` : '';

    return `A votação terminou e a opção vencedora foi **${top1.opt.emoji} – ${top1.opt.text}** ` +
      `com **${top1.stat.numReacts} (${top1.stat.percent}%)** votos.` +
      `\n Votaram: ${top1.opt.users.join(', ')}` +
      '\n' +
      `**2º Lugar** – ${top2.opt.emoji} ${top2.opt.text} – ${top2.stat.numReacts} (${top2.stat.percent}%)\n` +
      `**3º Lugar** – ${top3.opt.emoji} ${top3.opt.text} – ${top3.stat.numReacts} (${top3.stat.percent}%)\n` +
      `${excludedText}`
  }

  async addUser(user, reaction) {
    const option = this.#findOption(reaction);
    option.users = [...option.users, user.toString()];

    await db.update({ _id: this.message.id }, { $set: { options: this.options } });

    this.message.edit(this.render());
  }

  async removeUser(user, reaction) {
    const option = this.#findOption(reaction);
    option.users = option.users.filter(u => u !== user.toString());

    await db.update({ _id: this.message.id }, { $set: { options: this.options } });

    this.message.edit(this.render());
  }

  #findOption(reaction) {
    const { name } = reaction.emoji;

    return this.options.find(o => o.emoji === name);
  }

  #reactionFilter(reaction, _user) {
    return this.#validReactions().includes(reaction.emoji.name);
  }

  #validReactions() {
    return this.options.map(opt => opt.emoji);
  }

  #optionStats(option) {
    const numReacts = option.users.length;
    const totalReacts = this.options.reduce((sum, opt) => {
      return sum + opt.users.length;
    }, 0);

    return {
      numReacts,
      percent: ((numReacts / totalReacts) * 100).toFixed(1)
    };
  }
}

module.exports = {
  Poll
}
