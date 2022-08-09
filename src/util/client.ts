import nodeCron from 'node-cron'
import { Client, Collection, GatewayIntentBits } from 'discord.js'
import { Routes } from 'discord-api-types/v9'
import { config } from '../config'
import { REST } from '@discordjs/rest'
import { Poll } from '@models/Poll'
import { Week } from '@models/Week'
import { Event } from '@models/Event'
import { Movie } from '@models/Movie'

const { token, applicationId, guildId } = config

type ClientType = Client & {
  polls?: Collection<string, Poll>
  events?: Collection<string, Event>
  calendarWeeks?: Collection<string, Week>
  movies?: Collection<string, Movie>
  birthdayScheduler?: nodeCron.ScheduledTask
}

export const client: ClientType = new Client({
  intents: [GatewayIntentBits.Guilds],
})

export const rest = new REST({ version: '10' }).setToken(token)
export const guildRoute = Routes.applicationGuildCommands(applicationId, guildId)
