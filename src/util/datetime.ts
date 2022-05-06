import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'

import 'dayjs/locale/pt'

dayjs.locale('pt')
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const dateFormats = [
  'YYYY/MM/DD',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'DD-MM-YYYY',
  'DD/MM',
  'DD-MM',
  'DD',
]

export const now = () => dayjs()

export const toDate = (dateStr: string) => dayjs(dateStr, dateFormats)

export const isDate = (dateStr: string) => toDate(dateStr).isValid()
