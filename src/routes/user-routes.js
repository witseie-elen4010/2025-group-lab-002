const express = require('express')
const router = express.Router()

router.get('/signup-login', (req, res) => {
  res.json({ message: 'Login/SignUp Page' })
})

// Signup and Login combined route (example placeholder)
router.post('/signup-login', (req, res) => {
  // Handle signup and login in one go (not common, but possible)
  res.json({ message: 'Signup and login handled together' })
})

// Independent Signup route
router.post('/signup', (req, res) => {
  // Handle signup logic here
  res.json({ message: 'User signed up' })
})

// Independent Login route
router.post('/login', (req, res) => {
  // Handle login logic here
  res.json({ message: 'User logged in' })
})

module.exports = router
