import { CommandRunnerType } from '@typings/command.type'
import { fetchChannel } from '@util/common'
import { EmbedBuilder, hyperlink } from 'discord.js'

export const AnnouncementRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const mainChannel = await fetchChannel({ name: 'geral' })
  const eventsChannel = await fetchChannel({ name: 'eventos' })
  const pollChannel = mainChannel

  if ([mainChannel, eventsChannel].some((channel) => !channel)) {
    interaction.editReply({ content: 'Canais não encontrados!' })

    return
  }

  await pollChannel?.send({
    content: '⚠️ Aviso ⚠️\n\n☝️ Todas as votações acima (e outras) foram desactivadas.',
  })

  await eventsChannel?.send({
    content: '⚠️ Aviso ⚠️\n\n☝️ Todos os eventos presentes no canal (e outros) foram desactivados.',
  })

  const infoEmbed = new EmbedBuilder()
    .setAuthor({ name: '𝙗𝙞𝙙𝙚𝙤𝙗𝙤𝙩 2.0' })
    .setTitle('🚨 Actualização 🚨')
    .setDescription(
      `\n\nCaros amigos, bem-vindos ao 𝙗𝙞𝙙𝙚𝙤𝙗𝙤𝙩 2.0.\nO ano passado, o Discord fez uma série de actualizações profundas que alteraram em grande parte a forma como os bots funcionam e a complexidade das interacções possíveis. Após vários meses de intensa laboura, o 𝙗𝙞𝙙𝙚𝙤𝙗𝙤𝙩 foi inteiramente reescrito de raíz para respeitar as novas normas e possibilidades de interacção suportadas pelo Discord.\n\n**Alterações principais**\n‣ Todos os comandos do bot estão agora disponíveis através da interface do discord (escrevam "/")\n‣ Automatização do processo de adicionar novos filmes e votações\n‣ Novo design para a caixa de votações\n‣ Possibilidade de editar eventos\n‣ Reescrito 100% em Typescript vegan e biodegradável (ver ${hyperlink(
        'aqui',
        'https://github.com/jmrfrosa/bideokluba-bot',
      )})\n\n🚧 De certeza que vamos contar com imensos bugs nos próximos tempos dado o grande número de alterações, pelo que a equipa de 𝙗𝙞𝙙𝙚𝙤𝙗𝙤𝙩 pede o obséquio da vossa compreensão.\n\nSem mais,\n_A Gerência_`,
    )

  await mainChannel?.send({
    embeds: [infoEmbed],
  })
}
