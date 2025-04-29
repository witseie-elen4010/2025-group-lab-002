require('dotenv').config() // Load .env variables
const app = require('./src/app')
const { testConnection } = require('./src/utils/db')
const { checkAndRestoreDatabase } = require('./src/utils/db-backup')

const PORT = process.env.PORT || 3000

// Check database connection and restore if necessary
checkAndRestoreDatabase()
  .then(() => {
    // Test database connection
    testConnection()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(error => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })
