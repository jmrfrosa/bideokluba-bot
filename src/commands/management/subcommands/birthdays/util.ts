import { BirthdayDocumentType } from '@typings/birthday.type'
import { fetchUser } from '@util/common'
import { toDate } from '@util/datetime'

export async function renderBirthdays(birthdayList: BirthdayDocumentType[]) {
  const strBirthdays = await Promise.all(
    birthdayList.map(async (bd) => {
      const user = await fetchUser({ id: bd.userId })

      return `${user.toString()}: ${toDate(bd.date).format('dddd, DD/MM')}`
    }),
  )

  return strBirthdays.join('\n')
}
