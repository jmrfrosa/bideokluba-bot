const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('Mostra ajuda acerca de todos os comandos do bot.'),
  async execute(interaction) {
    const { commands } = interaction.client;

    let helpMessage = '_Comandos disponíveis:_\n' +
      'Nota: \`<...>\` signifca um argumento obrigatório e \`[...]\` um argumento opcional';

    helpMessage += commands.reduce((msg, cmd) => (
      `${msg}\n**/${cmd.commandName}**: ${cmd.commandDescription}${cmdUsage(cmd)}`
    ), '');

    interaction.reply({ content: helpMessage, ephemeral: true });
  },
  args: 0,
  roles: [],
  guildOnly: false
}

function cmdUsage(command) {
  if(!command.usage) return '';

  return `\n   Exemplo: \`${prefix}${command.name} ${command.usage}\``
}
