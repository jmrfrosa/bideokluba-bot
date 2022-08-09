import { Collection as DiscordCollection } from 'discord.js'
import { Poll } from '@models/Poll'
import { Week } from '@models/Week'
import { Movie } from '@models/Movie'
import { Event } from '@models/Event'
import { logger } from '@util/logger'
import { CacheNames } from '@typings/enums'

type CacheKeyReturnType = {
  [CacheNames.Polls]: Poll
  [CacheNames.Movies]: Movie
  [CacheNames.Events]: Event
  [CacheNames.Weeks]: Week
}
type AnyModel = Poll | Movie | Event | Week

type FindReturnType<T extends CacheNames> = Promise<CacheKeyReturnType[T] | undefined>

export class CacheService {
  public polls = new DiscordCollection<string, Poll>()
  public movies = new DiscordCollection<string, Movie>()
  public events = new DiscordCollection<string, Event>()
  public weeks = new DiscordCollection<string, Week>()

  public cacheMap = {
    [CacheNames.Polls]: this.polls,
    [CacheNames.Movies]: this.movies,
    [CacheNames.Events]: this.events,
    [CacheNames.Weeks]: this.weeks,
  }

  async find(messageId?: string): Promise<AnyModel | undefined>
  async find<T extends CacheNames>(messageId?: string, modelType?: T): FindReturnType<T>
  async find<T extends CacheNames>(messageId?: string, modelType?: T) {
    if (!messageId) return

    const cacheHit = modelType
      ? this.searchModelCache(messageId, modelType)
      : this.searchAllCaches(messageId)

    if (cacheHit) return cacheHit

    return modelType
      ? await this.searchModelDb(messageId, modelType)
      : await this.searchAllDbs(messageId)
  }

  private searchModelCache(messageId: string, modelType: CacheNames) {
    return this.cacheMap[modelType].get(messageId)
  }

  private searchAllCaches(messageId: string) {
    for (const { name } of this.collections()) {
      const cached = this.searchModelCache(messageId, name)

      if (cached) return cached
    }
  }

  private async searchModelDb(messageId: string, modelType: CacheNames) {
    const collection = this.collections().find(({ name }) => name === modelType)

    if (!collection) return

    const { obj } = collection

    const result = await obj.model.findOne({ message: messageId })

    if (!result) return

    // @ts-expect-error can't correctly combine result types
    const instance = await obj.hydrate(result)
    // @ts-expect-error can't correctly assign typed instance to typed cache
    this.cacheMap[modelType].set(messageId, instance)

    logger.info('Caching %o %o', modelType, messageId)

    return instance
  }

  private async searchAllDbs(messageId: string) {
    for (const { name } of this.collections()) {
      const result = await this.searchModelDb(messageId, name)

      if (result) return result
    }
  }

  private collections() {
    return [
      { name: CacheNames.Polls, obj: Poll },
      { name: CacheNames.Movies, obj: Movie },
      { name: CacheNames.Events, obj: Event },
      { name: CacheNames.Weeks, obj: Week },
    ]
  }
}

export const entityCache = new CacheService()
