import { EmbedBuilder } from '@discordjs/builders'
import { BirthdayDocumentType } from '@typings/birthday.type'
import { CommandRunnerType } from '@typings/command.type'
import { db } from '@util/database'
import { renderBirthdays } from './util'

export const ViewBirthdaysRunner: CommandRunnerType = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const birthdays: BirthdayDocumentType[] = await db.find({
    model: 'birthday',
  })

  const embed = new EmbedBuilder().setDescription(
    await renderBirthdays(birthdays),
  )

  interaction.editReply({ embeds: [embed] })
}
