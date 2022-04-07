const { db } = require('../util/database.js');
const birthdayList = require('../static/birthdays.json');

module.exports = {
  name: 'import_birthdays',
  async execute() {
    console.log('Deleting existing birthdays.');
    await db.remove({ model: 'birthday' });

    console.log('Importing new birthday list...');

    for(const { id, date } of birthdayList) {
      await db.update({
        userId: id
      }, {
        userId: id,
        model: 'birthday',
        date
      }, {
        upsert: true
      })
    }

    const updatedList = await db.find({ model: 'birthday' });

    console.log('Birthday list was updated.');

    const currentList = updatedList.map(birthday => `${birthday.userId} - ${birthday.date}`)
    console.log('Current list:', currentList);
  }
}
