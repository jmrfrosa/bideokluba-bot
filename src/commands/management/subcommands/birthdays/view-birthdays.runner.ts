import { EmbedBuilder } from '@discordjs/builders'
import { Birthday } from '@models/Birthday'
import { fetchUser } from '@util/common'
import { toDate } from '@util/datetime'
import { BirthdayDocumentType } from '@typings/birthday.type'
import { CommandRunnerType } from '@typings/command.type'

export const ViewBirthdaysRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const birthdays = await Birthday.model.find({}).toArray()

  const embed = new EmbedBuilder().setDescription(await renderBirthdays(birthdays))

  interaction.editReply({ embeds: [embed] })
}

async function renderBirthdays(birthdayList: BirthdayDocumentType[]) {
  const strBirthdays = await Promise.all(
    birthdayList.map(async (bd) => {
      const user = await fetchUser({ id: bd.userId })

      return `${user.toString()}: ${toDate(bd.date).format('dddd, DD/MM')}`
    }),
  )

  return strBirthdays.join('\n')
}
