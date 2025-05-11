const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'users'
});

// Define WordPair model
const WordPair = sequelize.define('WordPair', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  civilian_word: {
    type: DataTypes.STRING,
    allowNull: false
  },
  undercover_word: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'word_pairs'
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Function to find a user by ID
async function findUserById(userId) {
  try {
    return await User.findByPk(userId);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

// Function to find a user by username
async function findUserByUsername(username) {
  try {
    return await User.findOne({ where: { username } });
  } catch (error) {
    console.error('Error finding user by username:', error);
    throw error;
  }
}

// Function to find a user by email
async function findUserByEmail(email) {
  try {
    return await User.findOne({ where: { email } });
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  User,
  findUserById,
  findUserByUsername,
  findUserByEmail,
  WordPair
}; 