const { client } = require('../util/client');
const { EventLoader } = require('./EventLoader');

class ReactionHandler {
  static async add({ reaction, user }) {
    const messageId = reaction.message.id;
    const poll = client.polls.get(messageId);
    const event = client.events.get(messageId);

    if(poll) await ReactionHandler.#handlePoll({ poll, reaction, user, action: 'add' });
    if(event) await ReactionHandler.#handleEvent({ event, reaction, user });
  }

  static async remove({ reaction, user }) {
    const messageId = reaction.message.id;
    const poll = client.polls.get(messageId);

    if(poll) await ReactionHandler.#handlePoll({ poll, reaction, user, action: 'remove' });
  }

  static #handlePoll({ poll, reaction, user, action }) {
    switch (action) {
      case 'add':
        return poll.addUser(user, reaction);
      case 'remove':
        return poll.removeUser(user, reaction);
    }
  }

  static #handleEvent({ event, reaction, user }) {
    return event.updateUser({
      user,
      state: EventLoader.reactionHandler(reaction, user)
    });
  }
}

module.exports = {
  ReactionHandler
}
