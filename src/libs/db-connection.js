const mongoose = require('mongoose');
const { DB_HOST, DB_PORT, DB_NAME } = require('./config');
const DB_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

module.exports = (() => {

  let instance = null,
      isDisconecting = false;

  function connect() {

    return new Promise(async (resolve, reject) => {
      instance = await mongoose.connect(DB_URI, { useNewUrlParser: true}, (err) => {
        if (err) throw err;
      });
      console.log('Succesfully connected to Database.');
      resolve(instance);
    })

  }

  function disconnect() {

    if (instance && !isDisconnecting) {
      isDisconnecting = true;
      return new Promise((resolve, reject) => {
        mongoose.disconnect((err) => {
          if (err) {
            reject(err);
            isDisconnecting = false;
            return
          }
          console.log('Database disconnection succesful!');
          resolve();
        })
      })
    }

  }

  return {
    connect,
    disconnect,
    instance
  }

})()