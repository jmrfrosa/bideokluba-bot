const { client } = require('./client.js');

const fetchChannel = ({ id = null, name = null, fromCache = true }) => {
  const { channels } = client;
  const { cache } = channels;

  if(!id) return cache.find(c => c.name == name);

  return fromCache ?
    (cache.get(id) || cache.find(c => c.name == name)) : channels.fetch(id);
}

const fetchMessage = async ({ id, channel, fromCache = true }) => {
  return fromCache ?
    channel.messages.cache.get(id) : channel.messages.fetch(id);
}

const parseMessageId = (content) => {
  if (content.search(/^(https:\/\/discord.com\/channels\/)/) >= 0)
    return content.substring(content.lastIndexOf('/') + 1)

  return content;
}

const getUserFromMention = (client, mention) => {
  if(!mention) return;

  const matches = mention.match(/^<@!?(\d+)>$/);
  if(!matches) return;

  const id = matches[1];
  return client.users.cache.get(id);
}

module.exports = {
  fetchChannel,
  fetchMessage,
  parseMessageId,
  getUserFromMention
}
