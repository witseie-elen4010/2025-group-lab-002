const express = require('express')
const app = express()

// Middleware
app.use(express.json()) // To parse JSON request bodies

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
