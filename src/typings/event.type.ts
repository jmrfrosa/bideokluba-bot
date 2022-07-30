import { Dayjs } from 'dayjs'
import { Message, TextChannel } from 'discord.js'
import { Event } from '@models/Event'
import { Week } from '@models/Week'

export type EventDocumentType = {
  week: string
  active: boolean
  message: string
  channel: string
  title: string
  date: string
  author: string
  attendance: {
    '✅ vou': string[]
    '❌ não vou': string[]
    '🤷‍♂️ talvez': string[]
  }
}

export type EventOptionKeys = keyof typeof Event.options
export type EventOptionValues = typeof Event.options[keyof typeof Event.options]

export interface EventInterface {
  title: string
  channel: TextChannel
  date: Dayjs
  author: string
  active?: boolean
  message?: Message<boolean> | null
  week?: Week | string | null
  attendance?: Map<string, Set<string>> | null
}
