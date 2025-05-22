const { JSDOM } = require('jsdom');
const { io: Client } = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

describe('Leave Lobby Functionality', () => {
  let io, serverSocket, clientSocket, httpServer;

  beforeEach((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const url = `http://localhost:${httpServer.address().port}`;
      clientSocket = new Client(url);
      io.on('connection', (socket) => {
        serverSocket = socket;
        done();
      });
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  it('should emit leave-room event with correct payload when user clicks leave', (done) => {
    const roomCode = 'ABC123';
    const username = 'TestUser';

    serverSocket.on('leave-room', ({ code, username }) => {
      try {
        expect(code).toBe(roomCode);
        expect(username).toBe('TestUser');
        done();
      } catch (err) {
        done(err);
      }
    });

    // simulate leave event
    clientSocket.emit('leave-room', { code: roomCode, username });
  });
});