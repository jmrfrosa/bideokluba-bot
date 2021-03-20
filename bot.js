require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config');
const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
  const command = require(`./commands/${file}`);

  client.commands.set(command.name, command);
})

client.once('ready', () => {
  console.log('Connected to Discord!');
});

client.on('message', message => {
  if(!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const commandName = args.shift().toLowerCase();

  if(!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  try {
    command.execute(message, args);
  } catch(error) {
    console.error(error);
  }
});

client.login(token);
