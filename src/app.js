const path = require('path');

const express = require('express');
const app = express();
const { router } = require('./routes/user-routes.js');
const { router: gameRouter } = require('./routes/game-routes.js');
const voteRouter = require('./routes/vote-routes.js');
const { router : adminRouter} = require("./routes/admin-routes.js");

// Middleware for JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/users', router);
app.use('/api/game', gameRouter);
app.use('/api/votes', voteRouter);
app.use('/api/admin', adminRouter);

// 404 Handler for any undefined routes
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, './public/not-found.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).sendFile(path.join(__dirname, './public/server-error.html'));
});

module.exports = app;