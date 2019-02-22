const socket = io();

let symbol,
    myTurn;

// functions
function renderTurnMessage() {
  $('#leftSide .player-symbol').text(`${symbol}`);

  if (myTurn) {
    $('#centerSide .alert').text(`Your Turn`);
    $('.gameholder button').removeAttr('disabled');
  } else {
    $('#centerSide .alert').text(`Opponent\'s Turn`);
    $('.gameholder button').attr('disabled', true);
  }
}

function makeMove(e) {
  e.preventDefault();

  if (!myTurn) return;

  if ($(this).text().length) return;

  socket.emit('client-make.move', {
    symbol,
    position: $(this).attr('id')
  });
}

function getBoardState() {
  let obj = {};

  $('.gameholder button').each( function () {
    obj[$(this).attr('id')] = $(this).text() || '';
  });

  return obj;
}

function isGameOver() {
  let matches = ['XXX', 'OOO'];
  let state = getBoardState();
  let combinations = [
    state.a0 + state.a1 + state.a2,
    state.b0 + state.b1 + state.b2,
    state.c0 + state.c1 + state.c2,
    state.c0 + state.b1 + state.a2,
    state.a0 + state.b1 + state.c2,
    state.a0 + state.b0 + state.c0,
    state.a1 + state.b1 + state.c1,
    state.a2 + state.b2 + state.c2
  ];
  let cont = 0;
  let fullBoard = false;

  combinations.forEach(combination => {
    if (combination.length === 3) {
      cont++;
    }

    if (cont === combinations.length) {
      fullBoard = true;
    } else {
      fullBoard = false;
    }
  });

  if (fullBoard) {
    if (combinations.some(combination => combination === matches[0] || combination === matches[1])) {
      won = true;
      draw = false;
    } else {
      won = false;
      draw = true;
    }
  } else {
    if (combinations.some(combination => combination === matches[0] || combination === matches[1])) {
      won = true;
      draw = false;
    } else {
      won = false;
      draw = false;
    }
  }
}

function restartGame(e) {
  e.preventDefault();

  $('.gameholder button').text('');
  $('#centerSide .alert').text(`Waiting for opponent to join...`);

  socket.emit('client-restart.game');
}

function renderHistory(started, draw, won) {
  $('#leftSide .started .number').text(started);
  $('#leftSide .draw .number').text(draw);
  $('#leftSide .won .number').text(won);

  won = false;
  draw = false;
}

function pauseGame(e) {
  e.preventDefault();

  let state = getBoardState();
  let combinations = [
    state.a0 + state.a1 + state.a2,
    state.b0 + state.b1 + state.b2,
    state.c0 + state.c1 + state.c2,
    state.c0 + state.b1 + state.a2,
    state.a0 + state.b1 + state.c2,
    state.a0 + state.b0 + state.c0,
    state.a1 + state.b1 + state.c1,
    state.a2 + state.b2 + state.c2
  ];

  function checkAreEmpty(combination) {
    return combination === '';
  }

  if (combinations.every(checkAreEmpty)) {
    $('#errorModalTitle').text('Error');
    $('#errorModal .modal-body').text('To pause the game, the board must have at least one movement');
    $('#errorModal').modal('show');
  } else {
    socket.emit('client-pause.game', {
      status: 'paused',
      boardState: state,
      symbol,
      turn: myTurn
    });
  }
}

function renderList(pausedGameId, pausedGameBoard) {
  $('#rightSide .wrapper-list').append(`
    <div class="list-paused-games px-md-0 pl-md-3 px-lg-4">
      <div class="paused-game text-center">
        <p>Game #${pausedGameId}</p>
        <button type="button" id="${pausedGameId}" class="resume-game btn btn-outline-success">Resume</button>
      </div>
      <div class="paused-board" id = "game${pausedGameId}">
        <table class="table text-center" id="pausedGameBoard">
          <tr>
            <td id="a0" class="square"></td>
            <td id="a1" class="square tdmiddle"></td>
            <td id="a2" class="square"></td>
          </tr>
          <tr class="trmiddle">
            <td id="b0" class="square"></td>
            <td id="b1" class="square tdmiddle"></td>
            <td id="b2" class="square"></td>
          </tr>
          <tr>
            <td id="c0" class="square"></td>
            <td id="c1" class="square tdmiddle"></td>
            <td id="c2" class="square"></td>
          </tr>
        </table>
      </div>
    </div>
  `);

  for (let tile in pausedGameBoard) {
    $('#game' + pausedGameId + ' #pausedGameBoard #' + tile).text(pausedGameBoard[tile]);
  }
}

function resumeGame(e) {
  e.preventDefault();

  console.log($(this).attr('id'));

  socket.emit('client-resume.game', {
    gameId: $(this).attr('id')
  });
}

// events
socket.on('server-game.start', (data) => {
  $('.gameholder button').text('');
  symbol = data.symbol;
  myTurn = (symbol === 'X');

  renderTurnMessage();
});

socket.on('server-move.made', (data) => {
  // render the move
  $('#' + data.position).text(data.symbol);
  // update the turn
  myTurn = (symbol !== data.symbol);

  isGameOver();

  if (!won && !draw) {
    renderTurnMessage();
  } else {
    if (myTurn && won) {
      $('#myModalTitle').text('Game Over');
      $('#myModal .modal-body').text('YOU LOST');
      $('#myModal').modal('show');

      socket.emit('client-game.over', {
        won,
        draw
      });
    } 
    
    if (!myTurn && won) {
      $('#myModalTitle').text('Game Over');
      $('#myModal .modal-body').text('YOU WON');
      $('#myModal').modal('show');
    }

    if (draw) {
      $('#myModalTitle').text('Game Over');
      $('#myModal .modal-body').text('Game Draw!');
      $('#myModal').modal('show');

      if (myTurn) {
        socket.emit('client-game.over', {
          won,
          draw
        });
      }
    }

    $('.gameholder button').attr('disabled', true);
  }
});

socket.on('server-history.update', (data) => {
  renderHistory(data.started, data.draw, data.won);
});

socket.on('server-paused.game', (pausedGame) => {
  $('#myModalTitle').text('Paused Game');
  $('#myModal .modal-body').text(`Player ${pausedGame.symbol} has paused the Game #${pausedGame.gameId}`);
  $('#myModal').modal('show');
});

socket.on('server-list.empty', () => {
  $('#rightSide .wrapper-list').empty();
});

socket.on('server-list.update', (data) => {
  renderList(data.gameId, data.boardState);
});

socket.on('server-waiting.opponent', () => {
  $('#errorModalTitle').text('Error');
  $('#errorModal .modal-body').text('Waiting for opponent to resume the game');
  $('#errorModal').modal('show');
});

socket.on('server-resumed.game', (data) => {
  // render the boardstate of the resumed game
  for (let tile in data.boardState) {
    $('#gameholder #' + tile).text(data.boardState[tile]);
  }

  // taking the turn of the resumed game
  if (symbol === data.symbol) {
    myTurn = data.turn;
  } else {
    myTurn = !data.turn;
  }

  renderTurnMessage();

  // delete the resumed game of the list
  socket.emit('client-delete.resumed.game', data.gameId);
});

$(function () {
  $('.gameholder button').text('');
  $('.gameholder button').attr('disabled', true);
  $('.gameholder button').on('click', makeMove);
  $('#myModal').modal('hide');
  $('#myModal .closeModal').on('click', restartGame);
  $('#centerSide .pause-game').on('click', pauseGame);
  $('#rightSide').on('click', '.resume-game', resumeGame);
});