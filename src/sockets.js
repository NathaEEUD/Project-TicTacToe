module.exports = function (io) {

  // events
  io.on('connection', (socket) => {
    console.log('New connection', socket.id);
  });

}