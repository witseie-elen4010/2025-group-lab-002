const sequelize = require('../config/database');
const { DataTypes, Op } = require('sequelize');

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

// Define Vote model
const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  voted_for_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  round_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'votes'
});

// Define AdminLog model
const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  }, 
  username: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'admin_logs'
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

async function findLogsBetweenTimestamps(startDate, endDate) {
  try {
    return await AdminLog.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    });
  } catch (error) {
    console.error('Error fetching logs between timestamps:', error);
    throw error;
  }
}

async function findLogsForRoom(room) {
  try {
    return await AdminLog.findAll({
      where: {
        room
      },
      order: [['timestamp', 'DESC']]
    });
  } catch (error) {
    console.error('Error fetching logs for room:', error);
    throw error;
  }
}

async function findLogsByUserId(userId) {
  try {
    return await AdminLog.findAll({
      where: { user_id: userId },
      order: [['timestamp', 'DESC']]
    });
  } catch (error) {
    console.error('Error fetching logs for user:', error);
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
  WordPair,
  Vote,
  AdminLog,
  findLogsBetweenTimestamps,
  findLogsForRoom,
  findLogsByUserId
};