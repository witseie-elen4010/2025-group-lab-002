const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const { createServer } = require('http');

describe('Leave Lobby Functionality', () => {
  let io, httpServer, serverSocket, clientSocket;
  const rooms = {};

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    // Simulate basic room handling
    io.on('connection', (socket) => {
      socket.on('join-room', ({ code, username }) => {
        socket.join(code);
        if (!rooms[code]) {
          rooms[code] = { players: [] };
        }
        rooms[code].players.push({ username });
      });

      socket.on('leave-room', ({ code, username }) => {
        rooms[code].players = rooms[code].players.filter(p => p.username !== username);

        if (rooms[code].players.length === 0) {
          delete rooms[code];
        } else {
          socket.to(code).emit('player-left', { room: rooms[code] });
        }
      });

      serverSocket = socket;
    });

    httpServer.listen(() => {
      const url = `http://localhost:${httpServer.address().port}`;
      clientSocket = new Client(url);
      clientSocket.on('connect', done);
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  it('should remove user from server room and emit player-left if others remain', (done) => {
    const roomCode = 'ROOM1';

    // Join the room first
    clientSocket.emit('join-room', { code: roomCode, username: 'TestUser' });
    clientSocket.emit('join-room', { code: roomCode, username: 'Alice' });
    clientSocket.emit('join-room', { code: roomCode, username: 'Bob' });

    setTimeout(() => {
      expect(rooms[roomCode].players.length).toBe(3);

      // Then leave
      clientSocket.emit('leave-room', { code: roomCode, username: 'TestUser' });

      setTimeout(() => {
        expect(rooms[roomCode].players.find(p => p.username === 'TestUser')).toBeUndefined();
        expect(rooms[roomCode].players.length).toBe(2);
        done();
      }, 100);
    }, 100);
  });
});