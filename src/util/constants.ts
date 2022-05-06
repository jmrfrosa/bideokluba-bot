export const roles = {
  admin: 'Fundador',
  moderador: 'Moderador',
  curator: 'Curador',
  active: 'Activo',
  botLog: 'Bot Lover',
}

export const imdb = {
  idRegex: /ev\d{7}\/\d{4}(-\d)?|(ch|co|ev|nm|tt)\d{7}/,
}

export const channels = {
  info: 'info',
  movies: 'filmes',
  offtopic: 'offtopic',
  bot: 'bot',
}

export const common = {
  cmdRegex: /(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g,
}

export const emojiMap = {
  '0': '0️⃣',
  '1': '1️⃣',
  '2': '2️⃣',
  '3': '3️⃣',
  '4': '4️⃣',
  '5': '5️⃣',
  '6': '6️⃣',
  '7': '7️⃣',
  '8': '8️⃣',
  '9': '9️⃣',
  next: '⏭️',
}

export const defaultOptions = [
  { text: 'Segunda', emoji: '2️⃣' },
  { text: 'Terça', emoji: '3️⃣' },
  { text: 'Quarta', emoji: '4️⃣' },
  { text: 'Quinta', emoji: '5️⃣' },
  { text: 'Sexta', emoji: '6️⃣' },
  { text: 'Sábado', emoji: '7️⃣' },
  { text: 'Domingo', emoji: '8️⃣' },
  { text: 'Próxima semana', emoji: '⏭️' },
]

export const rss = {
  pollingInterval: 3600000,
}
