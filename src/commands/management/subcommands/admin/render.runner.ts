import { CommandRunnerType } from '@typings/command.type'
import { logger } from '@util/logger'
import { AdminCommandNames } from '../../admin.command'
import { client } from '@util/client'

export const RenderRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const entityId = interaction.options.getString(AdminCommandNames.ENTITY_OPT)

  const renderQueue = []
  const selectedEntity = fetchEntity(entityId)

  if (selectedEntity) {
    renderQueue.push(selectedEntity)
  } else {
    const allEntities = [client.events, client.polls, client.calendarWeeks]
      .flatMap((collection) => (collection ? [...collection.values()] : []))
      .map((entity) => entity)

    renderQueue.push(...allEntities)
  }

  for (const entity of renderQueue) {
    logger.info('Re-rendering %o messages', renderQueue.length)

    await entity?.message?.edit({ content: '', embeds: [entity.render()] })
  }

  await interaction.editReply({ content: `${renderQueue.length} entidades foram re-renderizadas` })
}

function fetchEntity(id?: string | null) {
  if (!id) return

  const { events, polls, calendarWeeks: weeks } = client

  for (const entityCollection of [events, polls, weeks]) {
    if (!entityCollection) continue

    const entity = entityCollection.get(id)

    if (entity) return entity
  }
}
