import { Event } from '../models/Event'

export const gCalUrl = (event: Event) => {
  const baseUrl = 'https://calendar.google.com/calendar/render'

  const url = new URL(baseUrl)
  const params = {
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.date.format('YYYYMMDD')}/${event.date.format('YYYYMMDD')}`,
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  return url.toString()
}
