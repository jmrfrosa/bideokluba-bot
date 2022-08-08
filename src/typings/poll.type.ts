import { Message, TextChannel } from 'discord.js'
import { Movie } from '@models/Movie'

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
  movie?: string
}

export interface PollInterface {
  options: PollOption[]
  channel: TextChannel
  message?: Message
  header: string
  movie?: Movie
}
