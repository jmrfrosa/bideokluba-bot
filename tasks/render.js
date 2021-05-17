const { EventLoader } = require('../service/EventLoader.js');
const { PollLoader } = require('../service/pollLoader.js');
const { WeekLoader } = require('../service/WeekLoader.js');
const { client } = require('../util/client.js');

module.exports = {
  name: 'render',
  async execute(type) {
    switch (type) {
      case 'events':
        await EventLoader.load();
        await WeekLoader.load();

        for(const [_, event] of client.events) {
          await event.message.edit(event.render());
        }

        for(const [_, week] of client.calendarWeeks) {
          await week.message.edit(week.render());
        }

        console.log('Finished renders!');
        break;
      case 'polls':
        await PollLoader.load();

        for(const [_, poll] of client.polls) {
          await poll.message.edit(poll.render());
        }

        console.log('Finished renders!');
        break;
      default:
        console.error('Specify what type to re-render!');
        break;
    }
  }
}
