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