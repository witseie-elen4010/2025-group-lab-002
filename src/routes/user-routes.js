const express = require('express')
const router = express.Router()
const { User, sequelize, findUserById, findUserByUsername, findUserByEmail } = require('../utils/db')
const path = require('path');
const bcrypt = require('bcrypt')

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
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
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
    
    // Compare hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    if (user.username === "admin"){
      user.role = "admin"
    }else{
      user.role = "player"
    }
    console.log('Login Successful', user)
    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ message: 'Error logging in', error: error.message })
  }
})

router.get('/admin', async (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'))
})

router.get('/sign-up', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sign-up.html'))
})

router.get('/landing', async (req, res) => {
  res.sendFile(path.join(__dirname, '../public/landing-page.html'))
})

router.get('/login', async (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'))
})

// Get user by ID
router.get('/user/:id', async (req, res) => {
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




module.exports = { router }
