const Datastore = require('nedb-promises');
const { dbPath } = require('../config.js');

const db = Datastore.create(dbPath);

module.exports = {
  db
}
