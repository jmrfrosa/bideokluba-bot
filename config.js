const path = require('path');

const appPath = path.resolve(__dirname);

module.exports = {
  appPath,
  prefix: "!",
  token: process.env.BOT_TOKEN,
  omdbToken: process.env.OMDB_TOKEN,
  dbPath: path.join(appPath, '/db/datastore.db')
}
