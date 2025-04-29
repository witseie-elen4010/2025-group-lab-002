require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read environment variables
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST || 'localhost';

async function createBackup() {
  const backupDir = path.join(__dirname, '../../backups');
  const backupFile = path.join(backupDir, 'database-backup.sql');

  // Ensure the backups folder exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} ${DB_NAME} > "${backupFile}"`;

  console.log('Creating backup...');

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error creating backup:', error.message);
      return;
    }
    if (stderr) {
      console.error('Backup stderr:', stderr);
      return;
    }
    console.log('Backup created successfully at', backupFile);
  });
}

createBackup();