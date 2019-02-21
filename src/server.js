const path = require('path');

const express = require('express');
const app = express();

const database = require('./libs/db-connection');

// settings
app.set('port', process.env.PORT || 3001);
app.use(express.static(path.join(__dirname, 'public')));

function initServer() {

  // start the server
  const server = app.listen(app.get('port'), () => {
    console.log('Server listening on port', app.get('port'));
  });
  
  // websockets
  const SocketIO = require('socket.io');
  const io = SocketIO(server);
  require('./sockets')(io);

}

// connect to database
async function initDB() {

  const db = await database.connect();
  if (db) initServer();

}

initDB();