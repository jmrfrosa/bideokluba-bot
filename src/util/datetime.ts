import dayjs, { locale, extend, Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import utc from 'dayjs/plugin/utc'

import 'dayjs/locale/pt'

locale('pt')
extend(customParseFormat)
extend(isBetween)
extend(utc)

const dateFormats = ['YYYY/MM/DD', 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'DD/MM', 'DD-MM', 'DD']

export const now = () => dayjs()

export const toDateTime = (date?: string | number | Date | Dayjs) => {
  if (date instanceof Date) return dayjs(date.getTime())

  return dayjs(date)
}

export const toDate = (date?: string | number | Date | Dayjs) => {
  const convertedDate = dayjs(date, dateFormats)

  return convertedDate.utc(true)
}

export const isDate = (date?: string | number | Date | Dayjs) => Boolean(toDate(date)?.isValid())
