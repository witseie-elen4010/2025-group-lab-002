const { rooms } = require('../routes/game-routes');

function setupGameSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('join-room', ({ code, username }) => {
      socket.join(code);
      io.to(code).emit('player-joined', { username });
      io.to(code).emit('player-joined-lobby', { roomData: rooms[code] });
      console.log(`${username} joined room ${code}`);
    });

    socket.on('start-game', ({ code }) => {
      io.to(code).emit('start-game'); // Only emit this once, not nested
      console.log(`Game started in room ${code}`);
    });

    socket.on('room-created', ({ code, username }) => {
      socket.join(code);
      console.log(`Room ${code} created by ${username}`);
    });

    socket.on('user-joined', ({ username, code }) => {
      console.log(`${username} joined your room ${code}.`);
    });

    socket.on('submitClue', ({ roomCode, username, playerIndex, clue }) => {
      const room = rooms[roomCode]; // however you're storing room state
      room.clues.push({ username, clue });
  
      io.to(roomCode).emit('clueSubmitted', { playerIndex, clue });
  
      // Advance turn
      room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
  
      // Notify all clients of the new turn
      io.to(roomCode).emit('update-turn', {
          currentPlayerIndex: room.currentPlayerIndex
      });
  
      // If it's back to the first player, start discussion
      if (room.currentPlayerIndex === 0) {
          // You can emit a new event like 'start-discussion'
          io.to(roomCode).emit('startDiscussion');
      }
  });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
}

module.exports = setupGameSocket;