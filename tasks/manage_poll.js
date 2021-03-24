const { db } = require('../util/database.js');

const jsonFields = ['options', 'active'];

module.exports = {
  name: 'manage_poll',
  async execute(pollId, field, value) {
    let poll = await db.findOne({ _id: pollId });
    console.log(`Found ${poll._id}`);

    const v = jsonFields.includes(field) ? JSON.parse(value) : value

    poll = await db.update({ _id: pollId }, { $set: { [field]: v } }, { returnUpdatedDocs: true });

    console.log(`Poll field is now poll.${field} = ${poll[field]}`);
  }
}
