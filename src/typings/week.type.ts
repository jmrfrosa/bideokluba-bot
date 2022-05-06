import { Dayjs } from 'dayjs'
import { Collection, Message, TextChannel } from 'discord.js'
import { Event } from '../models/Event'

export type WeekDocumentType = {
  _id: string
  model: 'week'
  message: string
  channel: string
  weekStart: string
  weekEnd: string
  events: string[]
}

export interface WeekInterface {
  channel: TextChannel
  weekStart: Dayjs
  weekEnd: Dayjs
  events?: Collection<string, Event>
  message?: Message
}
