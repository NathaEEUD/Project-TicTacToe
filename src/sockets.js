module.exports = function (io) {

  let players = {},
      unmatched;

  //functions
  function joinGame(socket) {
    // save the new user, the first user is going to be X 
    players[socket.id] = {
      opponent: unmatched,
      symbol: 'X',
      socket
    };

    if (unmatched) {
      // when there is a second player, then there is a match
      players[socket.id].symbol = 'O';
      players[unmatched].opponent = socket.id;
      unmatched = null;
    } else {
      // when he is the first user, he will be unmatched
      unmatched = socket.id;
    }

    console.info(players);
    console.info(players[socket.id].symbol);
    console.info(unmatched);
  }

  function newConnection(socket) {
    console.log('New connection', socket.id);
    joinGame(socket);
  }

  // events
  io.on('connection', (socket) => {
    newConnection(socket);
  });

}