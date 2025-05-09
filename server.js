require('dotenv').config(); // Load .env variables
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { testConnection } = require('./src/utils/db');
const { checkAndRestoreDatabase } = require('./src/utils/db-backup');
const setupGameSocket = require('./src/sockets/game-socket'); // Assuming this is for game logic

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Check database connection and restore if necessary
checkAndRestoreDatabase()
  .then(() => {
    // Test database connection
    testConnection();

    // Initialize Socket.IO once the database is ready
    setupGameSocket(io);  // Assuming setupGameSocket sets up the necessary game event listeners

    io.on('connection', (socket) => {
      socket.on('room-created', ({ code, username }) => {
        socket.join(code);
        console.log(`Room ${code} created by ${username}`);
      });
    
      socket.on('join-room', ({ code, username }) => {
        socket.join(code);
        console.log(`${username} joined room ${code}`);
        // You can emit to the room:
        socket.to(code).emit('user-joined', { username });
      });
    
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    // Start the server and listen on the specified port
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1); // Exit the process if the database setup fails
  });