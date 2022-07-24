import { CommandInterface } from '@typings/command.type'
import { EventoCommand } from './events/evento.command'
import { AdminCommand } from './management/admin.command'
import { AjudaCommand } from './misc/ajuda.command'
import { CancelarCommand } from './misc/cancelar.command'
import { VotaçãoCommand } from './polls/votação.command'

export const commandList: CommandInterface[] = [
  EventoCommand,
  VotaçãoCommand,
  AdminCommand,
  AjudaCommand,
  CancelarCommand,
]
