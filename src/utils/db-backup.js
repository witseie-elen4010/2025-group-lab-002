const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const sequelize = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const BACKUP_FILE = path.join(BACKUP_DIR, 'database_backup.sql');

/**
 * Creates a backup of the database
 * @returns {Promise<void>}
 */
async function backupDatabase() {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
    
    const command = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p > ${BACKUP_FILE}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error backing up database:', error);
          reject(error);
          return;
        }
        console.log('Database backup completed successfully');
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to backup database:', error);
    throw error;
  }
}

/**
 * Restores the database from backup
 * @returns {Promise<void>}
 */
async function restoreDatabase() {
   console.time('restoreDatabase');
  try {
    // Check if backup file exists
    try {
      await fs.access(BACKUP_FILE);
    } catch (error) {
      console.error('Backup file not found:', BACKUP_FILE);
      throw new Error('Backup file not found');
    }

    const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;
    
    const command = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_FILE}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error restoring database:', error);
          reject(error);
          return;
        }
        console.log('Database restoration completed successfully');
        resolve();
      });
    });
  } catch (error) {
    console.error('Failed to restore database:', error);
    throw error;
  }
   console.timeEnd('restoreDatabase');
}

/**
 * Checks if the database exists and restores it if necessary
 * @returns {Promise<void>}
 */
async function checkAndRestoreDatabase() {
  console.time('checkAndRestoreDatabase');
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection successful');
  } catch (error) {
    console.log('Database connection failed, attempting to restore from backup...');
    await restoreDatabase();
  }
  console.timeEnd('checkAndRestoreDatabase');
}

module.exports = {
  backupDatabase,
  restoreDatabase,
  checkAndRestoreDatabase
}; 