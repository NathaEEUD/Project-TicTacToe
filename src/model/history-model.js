const mongoose = require('mongoose');
const { Schema } = mongoose;

const historySchema = new Schema ({
  started: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  draw: { type: Number, default: 0 }
});

module.exports = mongoose.model('History', historySchema);