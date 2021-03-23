const { Poll } = require('../Poll.js');
const { defaultOptions } = require('../../util/constants.js');

const defaultChannel = 'channel';
const defaultHeader = 'header';
const defaultMessage = 'message';

let defaultPoll = new Poll(defaultOptions, defaultChannel, { header: defaultHeader, message: defaultMessage });

test('.new', () => {
  const poll = defaultPoll;

  expect(poll.options).toBe(defaultOptions);
  expect(poll.channel).toBe(defaultChannel);
  expect(poll.message).toBe(defaultMessage);
  expect(poll.header).toMatch(defaultHeader);
});

describe('.render', () => {
  const optsCaseOne = [
    { emoji: '1️⃣', text: 'One', users: ['user1, user2']},
    { emoji: '2️⃣', text: 'Two', users: []              }
  ]

  const optsCaseOneStr = "Test header\n1️⃣ – One - **1 (100.0%)**\n    user1, user2\n2️⃣ – Two\n";

  const optsCaseTwo = [
    { emoji: '1️⃣', text: 'One', users: ['user1'] },
    { emoji: '2️⃣', text: 'Two', users: ['user2'] }
  ]

  const optsCaseTwoStr = "Test header\n1️⃣ – One - **1 (50.0%)**\n    user1\n2️⃣ – Two - **1 (50.0%)**\n    user2\n";

  describe.each([
    [optsCaseOne, optsCaseOneStr],
    [optsCaseTwo, optsCaseTwoStr]
  ])('Testing .render for several cases', (options, expected) => {
    let poll;

    beforeEach(() => {
      poll = defaultPoll;
      poll.options = options;
      poll.header = 'Test header';
    });

    afterEach(() => {
      defaultPoll.options = defaultOptions;
      defaultPoll.header = defaultHeader;
    });

    test('.render should output expected string', () => {
      expect(poll.render()).toMatch(expected);
    });
  });
});

describe('.report', () => {
  const optsCaseOne = [
    { emoji: '1️⃣', text: 'One', users: ['user1, user2']},
    { emoji: '2️⃣', text: 'Two', users: []              }
  ];

  const optsCaseOneStr = "A opção vencedora está a ser **1️⃣ – One** com **1 (100.0%)** votos.\n  Votaram nela: user1, user2\n**2º Lugar** – 2️⃣ Two – 0 (0.0%)\n\n";

  const optsCaseTwo = [
    { emoji: '1️⃣', text: 'One',   users: ['user1', 'user2', 'user3'] },
    { emoji: '2️⃣', text: 'Two',   users: ['user1', 'user4'] },
    { emoji: '3️⃣', text: 'Three', users: ['user2', 'user5'] },
    { emoji: '4️⃣', text: 'Four',  users: ['user2'] }
  ];

  const optsCaseTwoStr = "A opção vencedora está a ser **1️⃣ – One** com **3 (37.5%)** votos.\n  Votaram nela: user1, user2, user3\n**2º Lugar** – 2️⃣ Two – 2 (25.0%)\n\n**3º Lugar** – 3️⃣ Three – 2 (25.0%)\n\nVotaram na 2º e 3º mas não no vencedor: user4, user5";

  describe.each([
    [optsCaseOne, optsCaseOneStr],
    [optsCaseTwo, optsCaseTwoStr]
  ])('Testing .render for several cases', (options, expected) => {
    let poll;

    beforeEach(() => {
      poll = defaultPoll;
      poll.options = options;
      poll.header = 'Test header';
    });

    afterEach(() => {
      defaultPoll.options = defaultOptions;
      defaultPoll.header = defaultHeader;
    });

    test('.render should output expected string', () => {
      expect(poll.report()).toMatch(expected);
    });
  })
});
