const History = require('./model/history-model');
const Game = require('./model/game-model');

module.exports = function (io) {

  let players = {},
      unmatched;

  // Initializing the history collection
  History.find(async (err, data) => {
    if (err) throw err;

    if (!data.length) {
      let historyGames = new History();
      await historyGames.save();
    }
  });

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

  function getOpponent(socket) {
    if (!players[socket.id].opponent) return;

    // return the socket of the opponent
    return players[
      players[socket.id].opponent
    ].socket;
  }

  function historyUpdate(started, draw, won) {
    io.sockets.emit('server-history.update', {
      started,
      draw,
      won
    });
  }

  function listUpdate(socket, pausedGameId, pausedGameBoard) {
    socket.emit('server-list.update', {
      gameId: pausedGameId,
      boardState: pausedGameBoard
    });
  }

  async function newConnection(socket) {
    let started;

    console.log('New connection', socket.id);
    joinGame(socket);

    // empty the list of paused games and update it with the paused games stored
    socket.emit('server-list.empty');

    Game.find((err, list) => {
      if (err) throw err;

      if (list.length) {
        list.forEach(item => {
          listUpdate(socket, item.gameId, item.boardState);
        });
      }
    });

    if (getOpponent(socket)) {
      console.info('The game has started!');

      // updating the started variable of history collection
      await History.find((err, data) => {
        if (err) throw err;
        started = data[0].started;
      });

      History.findOneAndUpdate({}, { $set: { started: started + 1 } }, { new: true }, (err, data) => {
        if (err) throw err;
        console.log(data);
        historyUpdate(data.started, data.draw, data.won);
      });

      socket.emit('server-game.start', {
        symbol: players[socket.id].symbol
      });

      getOpponent(socket).emit('server-game.start', {
        symbol: players[getOpponent(socket).id].symbol
      });
    } else {
      console.info('Waiting for opponent...')
    }
  }

  // events
  io.on('connection', (socket) => {
    newConnection(socket);

    socket.on('client-make.move', (data) => {
      if(!getOpponent(socket)) return;

      socket.emit('server-move.made', data);
      getOpponent(socket).emit('server-move.made', data);
    });

    socket.on('client-game.over', async (data) => {
      if (data.won) {
        let won;

        // updating the won variable of history collection
        await History.find((err, data) => {
          if (err) throw err;
          won = data[0].won;
        });

        History.findOneAndUpdate({}, { $set: { won: won + 1 } }, { new: true }, (err, data) => {
          if (err) throw err;
          console.log(data);
          historyUpdate(data.started, data.draw, data.won);
        });
      }

      if (data.draw) {
        let draw;

        // updating the draw variable of history collection
        await History.find((err, data) => {
          if (err) throw err;
          draw = data[0].draw;
        });

        History.findOneAndUpdate({}, { $set: { draw: draw + 1 } }, { new: true }, (err, data) => {
          if (err) throw err;
          console.log(data);
          historyUpdate(data.started, data.draw, data.won);
        });
      }
    });

    socket.on('client-restart.game', () => {
      newConnection(socket);
    });

    socket.on('client-pause.game', async (data) => {
      console.log(data);

      let pausedGame = new Game({
        status: data.status,
        boardState: data.boardState,
        symbol: data.symbol,
        turn: data.turn
      });
      await pausedGame.save();   

      Game.find({}).sort({ gameId: -1 }).limit(1).exec((err, pausedGame) => {
        if (err) throw err;

        socket.emit('server-paused.game', {
          symbol: data.symbol,
          gameId: pausedGame[0].gameId
        });

        getOpponent(socket).emit('server-paused.game', {
          symbol: data.symbol,
          gameId: pausedGame[0].gameId
        });
      });
    });

    socket.on('client-resume.game', (data) => {
      // if there is not opponent, then show alert waiting for opponent to join the game
      if (!getOpponent(socket)) {
        socket.emit('server-waiting.opponent');
        return;
      }

      Game.find({ gameId: data.gameId }, (err, pausedGame) => {
        if (err) throw err;

        socket.emit('server-resumed.game', {
          boardState: pausedGame[0].boardState,
          symbol: pausedGame[0].symbol,
          turn: pausedGame[0].turn,
          gameId: pausedGame[0].gameId
        });

        getOpponent(socket).emit('server-resumed.game', {
          boardState: pausedGame[0].boardState,
          symbol: pausedGame[0].symbol,
          turn: pausedGame[0].turn,
          gameId: pausedGame[0].gameId
        });
      });
    });

    socket.on('client-delete.resumed.game', async (gameId) => {
      await Game.findOneAndDelete({ gameId: gameId }, (err, data) => {
        if (err) throw err;

        console.log('1', socket.id);
        console.log('Game sucessfully deleted');
      });

      Game.find((err, list) => {
        if (err) throw err;
        
        console.log('1', socket.id);

        socket.emit('server-list.empty');

        if (list.length) {
          list.forEach(item => {
            listUpdate(socket, item.gameId, item.boardState);
          });
        }
      });
    });

  });

}