function setupGameSocket(io) {
    io.on('connection', (socket) => {
      socket.on('join-room', ({ code, username }) => {
        socket.join(code);
        io.to(code).emit('player-joined', { username });
  
        console.log(`${username} joined room ${code}`);
      });
  
      socket.on('start-game', (code) => {
        io.to(code).emit('game-started');
      });
      
      socket.on('room-created', ({ code, username }) => {
        socket.join(code);
        console.log(`Room ${code} created by ${username}`);
      });

      socket.on('user-joined', ({ username, code }) => {

        console.log(`${username} joined your room ${code}.`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
  
  module.exports = setupGameSocket;