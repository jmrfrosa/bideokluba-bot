import { MessageReaction, User } from 'discord.js'
import { Poll } from '../models/Poll'
import { Event } from '../models/Event'
import { EventActionEnum } from '../typings/enums'
import { client } from '../util/client'
import { EventLoader } from './EventLoader'

export class ReactionHandler {
  static async add({
    reaction,
    user,
  }: {
    reaction: MessageReaction
    user: User
  }) {
    const messageId = reaction.message.id
    const poll = client.polls?.get(messageId)
    const event = client.events?.get(messageId)

    if (poll)
      await ReactionHandler.#handlePoll({
        poll,
        reaction,
        user,
        action: EventActionEnum.ADD,
      })
    if (event) await ReactionHandler.#handleEvent({ event, reaction, user })
  }

  static async remove({
    reaction,
    user,
  }: {
    reaction: MessageReaction
    user: User
  }) {
    const messageId = reaction.message.id
    const poll = client.polls?.get(messageId)

    if (poll)
      await ReactionHandler.#handlePoll({
        poll,
        reaction,
        user,
        action: EventActionEnum.REMOVE,
      })
  }

  static #handlePoll({
    poll,
    reaction,
    user,
    action,
  }: {
    poll: Poll
    reaction: MessageReaction
    user: User
    action: EventActionEnum
  }) {
    switch (action) {
      case EventActionEnum.ADD:
        return poll.addUser(user, reaction)
      case EventActionEnum.REMOVE:
        return poll.removeUser(user, reaction)
    }
  }

  static #handleEvent({
    event,
    reaction,
    user,
  }: {
    event: Event
    reaction: MessageReaction
    user: User
  }) {
    return event.updateUser({
      user,
      state: EventLoader.reactionHandler(reaction, user),
    })
  }
}
