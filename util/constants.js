const roles = {
  admin: 'Fundador',
  moderador: 'Moderador',
  curator: 'Curador',
  active: 'Activo'
}

const imdb = {
  idRegex: /ev\d{7}\/\d{4}(-\d)?|(ch|co|ev|nm|tt)\d{7}/
}

const channels = {
  info: 'info',
  movies: 'filmes'
}

const common = {
  cmdRegex: /(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g
}

const defaultOptions = [
  { text: 'Segunda'       , emoji: '2️⃣' },
  { text: 'Terça'         , emoji: '3️⃣' },
  { text: 'Quarta'        , emoji: '4️⃣' },
  { text: 'Quinta'        , emoji: '5️⃣' },
  { text: 'Sexta'         , emoji: '6️⃣' },
  { text: 'Sábado'        , emoji: '7️⃣' },
  { text: 'Domingo'       , emoji: '8️⃣' },
  { text: 'Próxima semana', emoji: '⏭️' }
]

const rss = {
  pollingInterval: 600000
}

module.exports = {
  roles,
  imdb,
  channels,
  common,
  defaultOptions,
  rss
}
