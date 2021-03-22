const { omdbToken } = require('../config.js');
const { imdb } = require('./constants.js');
const OmdbApi = require('omdb-api-pt');

const omdb = new OmdbApi({ apiKey: omdbToken });

const parseImdbId = (str) => {
  const { idRegex } = imdb;

  return str.match(idRegex)?.[0];
}

const findMovie = (id) => {
  return omdb.byId({ imdb: id });
}

const buildImdbUrl = (id) => {
  return `https://imdb.com/title/${id}`;
}

module.exports = {
  parseImdbId,
  buildImdbUrl,
  findMovie
}
