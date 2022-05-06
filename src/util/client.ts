import nodeCron from 'node-cron'
import { Client, Collection, Intents } from 'discord.js'
import { Routes } from 'discord-api-types/v9'
import { config } from '../config'
import { REST } from '@discordjs/rest'
import { Poll } from '../models/Poll'
import { Week } from '../models/Week'
import { Event } from '../models/Event'

const { token, applicationId, guildId } = config

type ClientType = Client & {
  polls?: Collection<string, Poll>
  events?: Collection<string, Event>
  calendarWeeks?: Collection<string, Week>
  birthdayScheduler?: nodeCron.ScheduledTask
}

export const client: ClientType = new Client({
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  intents: [Intents.FLAGS.GUILDS],
})

export const rest = new REST({ version: '9' }).setToken(token)
export const guildRoute = Routes.applicationGuildCommands(
  applicationId,
  guildId,
)
