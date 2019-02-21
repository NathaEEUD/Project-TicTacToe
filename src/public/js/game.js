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

// events
socket.on('server-game.start', (data) => {
  $('.gameholder button').text('');
  symbol = data.symbol;
  myTurn = (symbol === 'X');

  renderTurnMessage();
});

$(function () {
  $('.gameholder button').text('');
  $('.gameholder button').attr('disabled', true);
})