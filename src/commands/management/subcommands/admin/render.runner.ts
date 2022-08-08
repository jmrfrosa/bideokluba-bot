import { CommandRunnerType } from '@typings/command.type'
import { logger } from '@util/logger'
import { AdminCommandNames } from '../../admin.command'
import { performance } from 'perf_hooks'
import { entityCache } from '@service/CacheService'
import { Movie } from '@models/Movie'

export const RenderRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const entityId = interaction.options.getString(AdminCommandNames.ENTITY_OPT, true)

  const renderQueue = []
  const selectedEntity = await entityCache.find(entityId)

  if (!selectedEntity) {
    await interaction.editReply(`Não encontrei a entidade ${entityId}`)
    return
  }

  renderQueue.push(selectedEntity)

  // if (selectedEntity) {
  //   renderQueue.push(selectedEntity)
  // } else {
  //   const allEntities = [client.events, client.polls, client.calendarWeeks]
  //     .flatMap((collection) => (collection ? [...collection.values()] : []))
  //     .map((entity) => entity)

  //   renderQueue.push(...allEntities)
  // }

  const startTime = performance.now()
  logger.info('RenderRunner: Re-rendering %o messages...', renderQueue.length)
  for (const entity of renderQueue) {
    if (entity instanceof Movie) {
      await entity.render()
    } else {
      await entity?.message?.edit({ content: '', embeds: [entity.render()] })
    }
  }
  const endTime = performance.now()

  logger.info('Entity being re-rendered: %o', renderQueue)

  await interaction.editReply({
    content: `${renderQueue.length} entidades foram re-renderizadas em ${endTime - startTime} ms`,
  })
}
