<<<<<<< HEAD
const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config()

if (!admin.apps.length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './firebase-service-account.json'
  const serviceAccount = require(path.resolve(serviceAccountPath))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

module.exports = { db, admin }
=======
const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  charset:     'utf8mb4',
  dateStrings: true,
})

module.exports = pool
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
