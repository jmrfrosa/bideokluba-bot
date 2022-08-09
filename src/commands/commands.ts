import { CommandInterface } from '@typings/command.type'
import { EventoCommand } from './events/evento.command'
import { AdminCommand } from './management/admin.command'
import { AniversáriosCommand } from './management/aniversarios.command'
import { CancelarCommand } from './misc/cancelar.command'
import { MoviesCommand } from './movies/movies.command'
import { VotaçãoCommand } from './polls/votação.command'

export const commandList: CommandInterface[] = [
  EventoCommand,
  VotaçãoCommand,
  AdminCommand,
  CancelarCommand,
  AniversáriosCommand,
  MoviesCommand,
]
