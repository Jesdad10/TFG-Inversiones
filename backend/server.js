require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const authRoutes      = require('./src/routes/auth')
const articulosRoutes = require('./src/routes/articulos')

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth',      authRoutes)
app.use('/api/articulos', articulosRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})