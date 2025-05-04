const express = require('express')
const router = express.Router()
const { User, sequelize, findUserById, findUserByUsername, findUserByEmail } = require('../utils/db')

// Get all users route
router.get('/', async (req, res) => {
  try {
    // First ensure the table exists
    await sequelize.sync()

    const users = await User.findAll({
      attributes: ['id', 'username', 'email'] // Exclude password for security
    })

    console.log('Users:', users)
    
    // Check if users array is empty
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' })
    }
    
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Error fetching users', error: error.message })
  }
})

// Independent Signup route
router.post('/signup', async (req, res) => {
  try {
    console.log('Request Body:', req.body); // Debugging
    const { username, email, password } = req.body
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email) || await findUserByUsername(username)
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      email,
      password // Note: In a real app, you should hash this password
    })
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    })
    console.log('Signup Successful')
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ message: 'Error creating user', error: error.message })
  }
})

// Independent Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Find user by username
    const user = await findUserByUsername(username)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Check password (in a real app, you would compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    console.log('Login Successful', user)
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Error logging in', error: error.message })
  }
})

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await findUserById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Error fetching user' })
  }
})

router.get('/signup-login', (req, res) => {
  res.json({ message: 'Login/SignUp Page' })
})

// Signup and Login combined route (example placeholder)
router.post('/signup-login', (req, res) => {
  // Handle signup and login in one go (not common, but possible)
  res.json({ message: 'Signup and login handled together' })
})

module.exports = router
