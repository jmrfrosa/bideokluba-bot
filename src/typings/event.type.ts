import { Dayjs } from 'dayjs'
import { Message, TextChannel, User } from 'discord.js'
import { Event } from '@models/Event'
import { Week } from '@models/Week'

export type EventListValues = '✅ vou' | '❌ não vou' | '🤷‍♂️ talvez'

export type EventDocumentType = {
  week: string
  active: boolean
  message: string
  channel: string
  title: string
  date: Date
  author: string
  owner?: string
  attendance: { [key in EventListValues]: string[] }
}

export type EventOptionKeys = keyof typeof Event.options

export interface EventInterface {
  title: string
  channel: TextChannel
  date: Dayjs
  author: string
  owner?: User | null
  active?: boolean
  message?: Message<boolean> | null
  week?: Week | string | null
  attendance?: Map<EventListValues, Set<string>> | null
}
