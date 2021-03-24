require('dotenv').config();

const fs = require('fs');
const { token } = require('./config.js');
const { client } = require('./util/client.js');

const tasks = new Map();
const taskFiles = fs.readdirSync('./tasks').filter(file => file.endsWith('.js'));
taskFiles.forEach(file => {
  const task = require(`./tasks/${file}`);

  tasks.set(task.name, task);
});

client.login(token);

client.once('ready', async () => {
  console.log('Connected to Discord!');

  const args = process.argv.slice(2);
  const taskName = args[0];

  if(taskName == 'ls') console.log(tasks);

  if(!taskName) {
    console.log('No task name given!');
    return;
  }

  const task = tasks.get(taskName);

  if(!task) {
    console.log("Can't find task!");
    return;
  }

  task.execute(...args.slice(1));
});
