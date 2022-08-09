const { Poll } = require('../Poll.js');
const { defaultOptions } = require('../../util/constants.js');

const defaultChannel = 'channel';
const defaultHeader = 'header';
const defaultMessage = 'message';

let defaultPoll = new Poll({
  options: defaultOptions,
  channel: defaultChannel,
  message: defaultMessage,
  header: defaultHeader
});

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
  const case1 = [
    { emoji: '1️⃣', text: 'One', users: ['user1, user2'] },
    { emoji: '2️⃣', text: 'Two', users: [] }
  ];

  const case1str = "No topo está **1️⃣ – One** com **1 (100.0%)** votos.\n  Votaram : user1, user2\n**2º Lugar** – 2️⃣ Two – 0 (0.0%)\n";

  const case2 = [
    { emoji: '1️⃣', text: 'One',   users: ['user1', 'user2', 'user3', 'user7', 'user8'] },
    { emoji: '2️⃣', text: 'Two',   users: ['user1', 'user4', 'user8', 'user3'] },
    { emoji: '3️⃣', text: 'Three', users: ['user2', 'user5', 'user3'] },
    { emoji: '4️⃣', text: 'Four',  users: ['user2', 'user6'] }
  ];

  const case2str = "No topo está **1️⃣ – One** com **5 (35.7%)** votos.\n  Votaram : user1, user2, user3, user7, user8\n**2º Lugar** – 2️⃣ Two – 4 (28.6%)\n**3º Lugar** – 3️⃣ Three – 3 (21.4%)\nVotaram nas restantes mas não no vencedor: user4, user5, user6";

  const case3 = [
    { emoji: '1️⃣', text: 'One', users: ['user1', 'user2', 'user3'] },
    { emoji: '2️⃣', text: 'Two', users: ['user1', 'user4'] }
  ];

  const case3str = "No topo está **1️⃣ – One** com **3 (60.0%)** votos.\n  Votaram : user1, user2, user3\n**2º Lugar** – 2️⃣ Two – 2 (40.0%)\nVotaram nas restantes mas não no vencedor: user4";

  const case4 = [
    { emoji: '1️⃣', text: 'One', users: ['user1', 'user2'] },
    { emoji: '2️⃣', text: 'Two', users: ['user1', 'user2'] },
    { emoji: '3️⃣', text: 'Three', users: [] },
  ];

  const case4str = "No topo estão **1️⃣ – One**, **2️⃣ – Two** com **2 (50.0%)** votos.\n  Votaram na primeira: user1, user2";

  describe.each([
    [case1, case1str],
    [case2, case2str],
    [case3, case3str],
    [case4, case4str]
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
