const fs = require('fs');

const loadCommandsFromFilesystem = () => {
  return fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
}

module.exports = {
  loadCommandsFromFilesystem
}
