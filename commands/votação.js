const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('votação')
    .setDescription('Criar uma nova votação')
    .addSubcommand(subcommand => {
      subcommand
        .setName('datas')
        .setDescription('Cria uma nova votação para escolha de um intervalo de datas')
        .addStringOption(option => {
          option
            .setName('data_inicial')
            .setDescription('A data da primeira opção')
            .setRequired(false)
        })
        .addStringOption(option => {
          option
            .setName('data_final')
            .setDescription('A data da última opção')
            .setRequired(false)
        })
    })
}
