const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { fetchChannel, fetchMessage, setDifference } = require('../util/common.js');

class Poll {
  constructor({ options, channel, message = null, header = '' }) {
    this.options = options;
    this.channel = channel;
    this.message = message;
    this.header  = header;
  }

  static async fetch(id) {
    const dbPoll = await db.findOne({ _id: id });

    if(!dbPoll) {
      console.error(`Poll ${id} was found in the database`); return; }

    try {
      const channel = await fetchChannel({ id: dbPoll.channel, fromCache: false });

      if(!channel) {
        console.error(`Channel ${dbPoll.channel} was not found while fetching poll ${id}!`); return; }

      const message = await fetchMessage({ id, channel, fromCache: false });

      if(!message) {
        console.error(`Message ${id} was not found in channel ${channel.id}!`); return; }

      return new Poll({
        message,
        channel,
        options: dbPoll.options,
        header: dbPoll.header
      });
    } catch (error) {
      console.error('%O', error);
    }
  }

  async save(message) {
    this.message = message;

    const poll = await db.insert({
      _id: this.message.id,
      channel: this.channel.id,
      model: 'poll',
      options: this.options,
      header: this.header,
      active: true
    });

    client.polls.set(message.id, this);

    return poll;
  }

  async end() {
    const { id } = this.message;

    client.polls.delete(id)
    await db.update({ _id: id }, { $set: { active: false } })

    console.log(`Poll ${id} was deactivated.`);
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

      return `${msg}${emoji} ??? ${text}${users.length ? ` - ${statsText}${usersText}` : ''}\n`
    }, '');

    return `${this.header}\n${table}`;
  }

  report() {
    const stats = this.options
      .map(opt => ({ opt, stat: this.#optionStats(opt) }))
      .sort((a, b) => b.stat.numReacts - a.stat.numReacts);

    const winner = stats[0];

    const tied = stats.filter(s => s.stat.numReacts === winner.stat.numReacts).map(s => (
      `**${s.opt.emoji} ??? ${s.opt.text}**`
    ));
    const isTie = tied.length > 1;

    const allUsers = stats.reduce((acc, { opt: { users } }) => ([...acc, ...users]), []);
    const excludedUsers = [...setDifference(new Set(allUsers), winner.opt.users)];

    const excludedText = excludedUsers.length ?
      `Votaram nas restantes mas n??o no vencedor: ${excludedUsers.join(', ')}` : '';

    const runnerText = stats.slice(1,3).filter(t => t != null).map((t, idx) => (
      `**${idx + 2}?? Lugar** ??? ${t.opt.emoji} ${t.opt.text} ??? ${t.stat.numReacts} (${t.stat.percent}%)`
    ));

    const winnerText = `No topo ${isTie ? `est??o` : `est??`} ${tied.join(', ')}`;

    return `${winnerText} com **${winner.stat.numReacts} (${winner.stat.percent}%)** votos.` +
      `\n  Votaram ${isTie ? `na primeira`: ''}: ${winner.opt.users.join(', ')}` +
      `${isTie ? '' : `\n${runnerText.join('\n')}\n${excludedText}`}`
  }

  async addUser(user, reaction) {
    const option = this.#findOption(reaction);
    if(!option) return;

    option.users = [...option.users, user.toString()];

    await db.update({ _id: this.message.id }, { $set: { options: this.options } });

    this.message.edit(this.render());
  }

  async removeUser(user, reaction) {
    const option = this.#findOption(reaction);
    if(!option) return;

    option.users = option.users.filter(u => u !== user.toString());

    await db.update({ _id: this.message.id }, { $set: { options: this.options } });

    this.message.edit(this.render());
  }

  #findOption(reaction) {
    const { name } = reaction.emoji;

    return this.options.find(o => o.emoji === name);
  }

  #optionStats(option) {
    const numReacts = option.users.length;
    const totalReacts = this.options.reduce((sum, opt) => {
      return sum + opt.users.length;
    }, 0);

    return {
      numReacts,
      percent: ((numReacts / totalReacts || 0) * 100).toFixed(1)
    };
  }
}

module.exports = {
  Poll
}
