import { Poll } from '@models/Poll'
import { Dayjs } from 'dayjs'
import { Message, TextChannel, User } from 'discord.js'

export type MovieDocumentType = {
  message: string
  channel: string
  title: string
  url: string
  links: string[]
  polls: string[]
  poster?: string
  year?: number
  director?: string
  curator?: string
  discussionDate?: Date
}

export interface MovieInterface {
  message: Message<boolean>
  channel: TextChannel
  title: string
  url: string
  links: string[]
  polls: Poll[]
  poster?: string
  year?: number
  director?: string
  curator?: User
  discussionDate?: Dayjs
}
