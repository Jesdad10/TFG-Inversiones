require('dotenv').config()
const express = require('express')
const cors    = require('cors')

<<<<<<< HEAD
const authRoutes           = require('./src/routes/auth')
const articulosRoutes      = require('./src/routes/articulos')
const adminRoutes          = require('./src/routes/admin')
const notificacionesRoutes = require('./src/routes/notificaciones')
const seedAdmin            = require('./src/seed')
=======
const authRoutes      = require('./src/routes/auth')
const articulosRoutes = require('./src/routes/articulos')
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

<<<<<<< HEAD
app.use('/api/auth',           authRoutes)
app.use('/api/articulos',      articulosRoutes)
app.use('/api/admin',          adminRoutes)
app.use('/api/notificaciones', notificacionesRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  await seedAdmin()
=======
app.use('/api/auth',      authRoutes)
app.use('/api/articulos', articulosRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
>>>>>>> 6fa8c3bf44ea83c91dd02d55a504c5639964b953
})