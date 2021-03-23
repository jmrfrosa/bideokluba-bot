const roles = {
  admin: 'Fundador',
  curator: 'Curador'
}

const imdb = {
  idRegex: /ev\d{7}\/\d{4}(-\d)?|(ch|co|ev|nm|tt)\d{7}/
}

const channels = {
  info: 'info'
}

const common = {
  cmdRegex: /(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g
}

module.exports = {
  roles,
  imdb,
  channels,
  common
}
