require('dotenv').config() // Load .env variables
const app = require('./src/app')
const { testConnection } = require('./src/utils/db')

const PORT = process.env.PORT || 3000

// Test database connection
testConnection()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
