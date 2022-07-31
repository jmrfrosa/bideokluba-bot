import dayjs, { locale, extend, Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'

import 'dayjs/locale/pt'

locale('pt')
extend(customParseFormat)
extend(isBetween)

const dateFormats = ['YYYY/MM/DD', 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'DD/MM', 'DD-MM', 'DD']

export const now = () => dayjs()

export const toDate = (date?: string | number | Date | Dayjs) => dayjs(date, dateFormats)

export const isDate = (date?: string | number | Date | Dayjs) => toDate(date).isValid()
