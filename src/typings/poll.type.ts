import { Message, TextChannel } from 'discord.js'

export type PollOption = {
  text: string
  users: string[]
}

export type PollDocumentType = {
  _id: string
  channel: string
  model: 'poll'
  options: PollOption[]
  header: string
  active: boolean
}

export interface PollInterface {
  options: PollOption[]
  channel: TextChannel
  message?: Message
  header: string
}
