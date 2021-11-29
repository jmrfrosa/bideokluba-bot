const { rest, guildRoute } = require('../util/client.js')
const { loadCommandsFromFilesystem } = require('../util/commands');

class CommandDeployer {
  static deploy() {
    const commands = [];
    const commandFiles = loadCommandsFromFilesystem();

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      commands.push(command.data.toJSON());
    }

    rest.put(guildRoute, { body: commands })
      .then(() => console.log('Comandos registados com sucesso no servidor.'))
      .catch(console.error);
  }
}

module.exports = {
  CommandDeployer
}
