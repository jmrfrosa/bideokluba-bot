const { MessageAttachment } = require("discord.js");
const { getUserFromMention } = require('../util/common.js')
const Canvas = require('canvas');

module.exports = {
  name: 'cancelar',
  description: 'Cancela o \`<user1>\` e cria amizade com \`[user2]\` ou com o bot.',
  args: 1,
  roles: [],
  usage: '<user1> [user2]',
  guildOnly: true,
  async execute(message, args) {
    const { client, guild } = message;

    const enemyUser = getUserFromMention(client, args[0]);

    if(!enemyUser) {
      message.reply(`Não encontrei o utilizador. Experimenta usar o \`@\` certo desta vez.`);
      return;
    }

    const friendUser = getUserFromMention(client, args[1]) || client.user;

    const enemyName = guild.member(enemyUser).displayName;
    const friendName = guild.member(friendUser).displayName;

    const canvas = await renderImage({ enemyUser, enemyName }, { friendUser, friendName });

    const attachment = new MessageAttachment(canvas.toBuffer());

    message.channel.send(
      `AMIZADE CANCELADA COM ${enemyUser}, O MEU NOVO AMIGO É ${friendUser}`,
      { files: [attachment] }
    );
  }
}

async function renderImage(enemy, friend) {
  const { enemyUser, enemyName } = enemy;
  const { friendUser, friendName } = friend;

  Canvas.registerFont('./assets/anton.ttf', { family: 'Anton' });
  const canvas = Canvas.createCanvas(500, 372);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage('./assets/friendship_ended_template.png');
  const enemyAvatar = await Canvas.loadImage(enemyUser.displayAvatarURL({ format: 'jpg' }));
  const friendAvatar = await Canvas.loadImage(friendUser.displayAvatarURL({ format: 'jpg' }));
  const enemyCross = await Canvas.loadImage('./assets/enemy_cross.png');
  const friendCheck = await Canvas.loadImage('./assets/friend_check.png');

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(enemyAvatar, 0, 207, 106, 165);
  ctx.drawImage(enemyCross, 0, 207);
  ctx.drawImage(friendAvatar, 361, 225, 139, 147);
  ctx.drawImage(friendCheck, 361, 225);

  const gradient1 = ctx.createLinearGradient(330, 0, 330, 53);
  const gradient2 = ctx.createLinearGradient(196, 97, 196, 149);

  gradient1.addColorStop(0, '#c54d14');
  gradient1.addColorStop(1, '#44b328');
  gradient2.addColorStop(0, '#c0237c');
  gradient2.addColorStop(1, '#82794f');

  ctx.font = '50px Anton';
  ctx.fillStyle = gradient1;
  ctx.fillText(enemyName, 331, 53, 168);
  ctx.fillStyle = gradient2;
  ctx.fillText(friendName, 200, 150, 290);

  ctx.strokeStyle = '#522f64';
  ctx.lineWidth = 1;
  ctx.strokeText(enemyName, 331, 53, 168);
  ctx.strokeText(friendName, 200, 150, 290);

  return canvas;
}
