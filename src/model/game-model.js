const mongoose = require('mongoose');
const { Schema } = mongoose;
let autoIncrement = require('mongoose-auto-increment');

const { DB_HOST, DB_PORT, DB_NAME } = require('../libs/config');
const DB_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

let connection = mongoose.createConnection(DB_URI, { useNewUrlParser: true });

autoIncrement.initialize(connection);

const gameSchema = new Schema ({
  status: String,
  boardState: Object,
  symbol: String,
  turn: Boolean
});

gameSchema.plugin(autoIncrement.plugin, {
  model: 'Game',
  field: 'gameId',
  startAt: 1
});

module.exports = mongoose.model('Game', gameSchema);