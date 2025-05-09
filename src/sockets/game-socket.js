function setupGameSocket(io, rooms) {
    io.on('connection', (socket) => {
      socket.on('join-room', ({ code, username }) => {
        socket.join(code);
        io.to(code).emit('player-joined', { username });
  
        console.log(`${username} joined room ${code}`);
      });
  
      socket.on('start-game', (code) => {
        io.to(code).emit('game-started');
      });
    });
  }
  
  module.exports = setupGameSocket;