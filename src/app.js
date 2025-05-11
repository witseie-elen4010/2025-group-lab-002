const path = require('path');
const express = require('express')
const app = express()
const router = require('./routes/user-routes.js')
const voteRouter = require('./routes/vote-routes.js')

// Middleware
app.use(express.json()) // To parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/users', router)
app.use('/api/votes', voteRouter)

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something broke!' })
})

module.exports = app
