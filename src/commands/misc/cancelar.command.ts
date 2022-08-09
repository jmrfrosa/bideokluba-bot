import { SlashCommandBuilder } from '@discordjs/builders'
import * as Canvas from 'canvas'
import { AttachmentBuilder, User } from 'discord.js'
import { CommandInterface } from '@typings/command.type'
import { logger } from '@util/logger'

type UserWithNameTuple = [User, string]

export const CancelarCommand: CommandInterface = {
  data: new SlashCommandBuilder()
    .setName('cancelar')
    .setDescription('Cancela o primeiro utilizador e cria nova amizade com o segundo')
    .addUserOption((cancelledUser) =>
      cancelledUser.setName('inimigo').setDescription('amizade cancelada com').setRequired(true),
    )
    .addUserOption((friendUser) =>
      friendUser.setName('amigo').setDescription('o teu novo amigo').setRequired(false),
    ),
  run: async (interaction) => {
    await interaction.deferReply()

    const cancelledUser = interaction.options.getUser('inimigo')
    const friendUser = interaction.options.getUser('amigo') || interaction.client.user

    const guild = interaction.guild
    if (!guild || !cancelledUser || !friendUser) {
      logger.error(
        'cmdCancelar#run: Something went wrong while parsing the options in the interaction. %o',
        interaction,
      )
      return
    }

    const cancelledName = (await guild.members.fetch(cancelledUser)).displayName
    const friendName = (await guild.members.fetch(friendUser)).displayName

    const canvas = await renderImage([cancelledUser, cancelledName], [friendUser, friendName])

    const attachment = new AttachmentBuilder(canvas.toBuffer())

    interaction.editReply({
      content: `AMIZADE CANCELADA COM ${cancelledUser}, O MEU NOVO AMIGO É ${friendUser}`,
      files: [attachment],
    })
  },
}

async function renderImage(enemy: UserWithNameTuple, friend: UserWithNameTuple) {
  const [enemyUser, enemyName] = enemy
  const [friendUser, friendName] = friend

  Canvas.registerFont('./assets/anton.ttf', { family: 'Anton' })
  const canvas = Canvas.createCanvas(500, 372)
  const ctx = canvas.getContext('2d')

  const background = await Canvas.loadImage('./assets/friendship_ended_template.png')
  const enemyAvatar = await Canvas.loadImage(enemyUser.displayAvatarURL({ extension: 'jpg' }))
  const friendAvatar = await Canvas.loadImage(friendUser.displayAvatarURL({ extension: 'jpg' }))
  const enemyCross = await Canvas.loadImage('./assets/enemy_cross.png')
  const friendCheck = await Canvas.loadImage('./assets/friend_check.png')

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(enemyAvatar, 0, 207, 106, 165)
  ctx.drawImage(enemyCross, 0, 207)
  ctx.drawImage(friendAvatar, 361, 225, 139, 147)
  ctx.drawImage(friendCheck, 361, 225)

  const gradient1 = ctx.createLinearGradient(330, 0, 330, 53)
  const gradient2 = ctx.createLinearGradient(196, 97, 196, 149)

  gradient1.addColorStop(0, '#c54d14')
  gradient1.addColorStop(1, '#44b328')
  gradient2.addColorStop(0, '#c0237c')
  gradient2.addColorStop(1, '#82794f')

  ctx.font = '50px Anton'
  ctx.fillStyle = gradient1
  ctx.fillText(enemyName, 331, 53, 168)
  ctx.fillStyle = gradient2
  ctx.fillText(friendName, 200, 150, 290)

  ctx.strokeStyle = '#522f64'
  ctx.lineWidth = 1
  ctx.strokeText(enemyName, 331, 53, 168)
  ctx.strokeText(friendName, 200, 150, 290)

  return canvas
}
