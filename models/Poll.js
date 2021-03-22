const { client } = require('../util/client.js');
const { db } = require('../util/database.js');
const { fetchChannel, fetchMessage } = require('../util/common.js');

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
      const statsText = `**${stats.numReacts} (${(stats.percent * 100).toFixed(1)}%)**`;
      const usersText = `\n    ${userList}`;

      return `${msg}${emoji} – ${text}${users.length ? ` - ${statsText}${usersText}` : ''}\n`
    }, '');

    return `${this.header}\n${table}`;
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
      percent: numReacts / totalReacts
    };
  }
}

module.exports = {
  Poll
}
