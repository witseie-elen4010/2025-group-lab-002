require('dotenv').config(); // Load .env variables
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { testConnection } = require('./src/utils/db');
const setupGameSocket = require('./src/sockets/game-socket'); // Assuming this is for game logic
const { rooms } = require('./src/routes/game-routes');
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Test database connection
testConnection()
  .then(() => {
    // Initialize Socket.IO once the database is ready
    setupGameSocket(io, rooms);  // Assuming setupGameSocket sets up the necessary game event listeners

    // Start the server and listen on the specified port
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1); // Exit the process if the database setup fails
  });