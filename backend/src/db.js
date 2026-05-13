const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config()

let serviceAccount = null

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'))
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const db = admin.firestore()

db.settings({
  ignoreUndefinedProperties: true,
})

module.exports = {
  admin,
  db,
}