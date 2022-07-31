import { Client, Collection, Guild, GuildMember, TextChannel } from 'discord.js'
import { client } from './client'
import { emojiMap } from './constants'
import { logger } from './logger'

export const fetchChannel = ({
  id = null,
  name = null,
  fromCache = true,
}: {
  id?: string | null
  name?: string | null
  fromCache?: boolean
}) => {
  const { channels } = client
  const cache = channels.cache as Collection<string, TextChannel>

  if (!id) return cache.find((c) => c.name == name)

  return fromCache
    ? cache.get(id) || cache.find((c) => c.name == name)
    : (channels.fetch(id) as Promise<TextChannel>)
}

export const fetchMessage = async ({
  id,
  channel,
  fromCache = true,
}: {
  id?: string
  channel?: TextChannel
  fromCache: boolean
}) => {
  if (!channel || !id) {
    logger.error(`fetchMessage: one or more required arguments were not supplied | %o`, {
      id,
      channel,
    })
    return
  }

  return fromCache ? channel.messages.cache.get(id) : channel.messages.fetch(id)
}

export const fetchRole = async ({ guild, roleName }: { guild: Guild; roleName: string }) => {
  return guild.roles.cache.find((r) => r.name === roleName)
}

export const fetchMember = async ({
  guild,
  username,
}: {
  guild?: Guild | null
  username?: string | null
}) => {
  if (!guild || !username) {
    logger.error(`Guild: ${guild} or username: ${username} were not found.`)
    return
  }

  return guild.members.cache.find((m) => m.user.username == username)
}

export const fetchUser = async ({ id }: { id: string }) => {
  return await client.users.fetch(id)
}

export const parseMessageId = (content: string) => {
  if (content.search(/^(https:\/\/discord.com\/channels\/)/) >= 0)
    return content.substring(content.lastIndexOf('/') + 1)

  return content
}

export const getUserFromMention = (client: Client, mention: string) => {
  if (!mention) return

  const matches = mention.match(/^<@!?(\d+)>$/)
  if (!matches) return

  const id = matches[1]
  return client.users.cache.get(id)
}

export const setDifference = (setA: Iterable<unknown>, setB: Iterable<unknown>) => {
  const diff = new Set(setA)
  for (const e of setB) diff.delete(e)

  return diff
}

export const hasRole = (member: GuildMember, roles: string[]) => {
  return member.roles.cache.some((r) => roles.includes(r.name))
}

export const toEmoji = (text: keyof typeof emojiMap): typeof emojiMap[keyof typeof emojiMap] => {
  return emojiMap[text]
}
