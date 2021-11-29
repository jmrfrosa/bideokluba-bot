const path = require('path');

const appPath = path.resolve(__dirname);

module.exports = {
  appPath,
  prefix: "!",
  token: process.env.BOT_TOKEN,
  omdbToken: process.env.OMDB_TOKEN,
  dbPath: path.join(appPath, '/db/datastore.db'),
  clientId: 127953679801122816,
  guildId: 822532538466566185
}
