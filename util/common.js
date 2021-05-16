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

const fetchRole = async ({ guild, role }) => {
  return guild.roles.cache.find(r => r.name === role);
}

const fetchMember = async({ guild, username }) => {
  return guild.members.cache.find(m => (m.user.username == username));
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

const setDifference = (setA, setB) => {
  let diff = new Set(setA);
  for(let e of setB) diff.delete(e);
  return diff;
}

const hasRole = (member, roles) => {
  return member.roles.cache.some(r => (roles.includes(r.name)));
}

module.exports = {
  fetchChannel,
  fetchMessage,
  fetchRole,
  fetchMember,
  parseMessageId,
  getUserFromMention,
  hasRole,
  setDifference
}
