import { dbInstance } from '../service/DbService'
import { BirthdayDocumentType } from '../typings/birthday.type'

export class Birthday {
  static readonly collectionName = 'birthdays'
  static readonly model = dbInstance.db.collection<BirthdayDocumentType>(this.collectionName)
}
