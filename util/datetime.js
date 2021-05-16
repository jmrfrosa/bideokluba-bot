const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween')

require('dayjs/locale/pt');

dayjs.locale('pt');
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const dateFormats = [
  'YYYY/MM/DD',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'DD-MM-YYYY',
  'DD/MM',
  'DD-MM',
  'DD'
]

const now = () => (
  dayjs()
);

const toDate = (dateStr) => (
  dayjs(dateStr, dateFormats)
);

const isDate = (dateStr) => (
  toDate(dateStr).isValid()
);

module.exports = {
  now,
  toDate,
  isDate
};
