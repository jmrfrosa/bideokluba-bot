import { pino } from 'pino'

const transport = pino.transport({
  targets: [
    {
      target: 'pino/file',
      options: { destination: './log.json' },
      level: 'trace',
    },
    {
      target: 'pino-pretty',
      options: {
        ignore: 'hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
      },
      level: 'info',
    },
  ],
})

export const logger = pino(transport)
