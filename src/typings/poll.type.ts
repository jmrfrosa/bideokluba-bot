import { Message, TextChannel } from 'discord.js'

export type PollOption = {
  text: string
  users: string[]
}

export type PollDocumentType = {
  channel: string
  message: string
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
