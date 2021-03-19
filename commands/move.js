module.exports = {
  name: 'move',
  description: 'Mover uma mensagem para outro canal',
  args: true,
  usage: "<message_id || message_url> <channel_name>",
  guildOnly: true,
  execute(message, args) {
    if(args.length < 2) {
      return console.error(`Incorrect number of arguments. Usage: ${this.usage}`);
    }

    const messageId = parseMessageId(args[0]);
    const targetChannel = message.client.channels.cache.find(ch => ch.name === args[1])

    message.channel.messages.fetch(messageId)
      .then(msg => {
        const msgDate = msg.createdAt.toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
        let movedMessage = `${msg.member} | ${msg.channel} | ${msgDate}\n\n${msg.content}`

        const files = msg.attachments.map(file => file.proxyURL);

        targetChannel.send(movedMessage, {
          files: files,
          embeds: msg.embeds
        });

        msg.delete();
      });
  }
}

function parseMessageId(content) {
  if (content.search(/^(https:\/\/discord.com\/channels\/)/) >= 0)
    return content.substring(content.lastIndexOf('/') + 1)

  return content;
}
