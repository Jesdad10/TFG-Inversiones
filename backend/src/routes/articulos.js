const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const pool = require('../db')
const authMiddleware = require('../middleware/auth')

function validarInput(req, res) {
  const errores = validationResult(req)
  if (!errores.isEmpty()) {
    res.status(422).json({ error: errores.array()[0].msg })
    return false
  }
  return true
}

// ─── POST /api/articulos ───────────────────────────────────────────────────

router.post(
  '/',
  authMiddleware,
  [
    body('titulo').trim().notEmpty().withMessage('El título es obligatorio'),
    body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria'),
    body('categoria').notEmpty().withMessage('La categoría es obligatoria'),
    body('condicion').notEmpty().withMessage('La condición es obligatoria'),
    body('crypto').isIn(['ETH', 'BTC']).withMessage('Cripto no válida'),
    body('precio_crypto').isFloat({ min: 0.00001 }).withMessage('Precio no válido'),
    body('fotos').isArray({ min: 1 }).withMessage('Se requiere al menos una foto'),
  ],
  async (req, res) => {
    if (!validarInput(req, res)) return

    const {
      titulo, descripcion, categoria, condicion,
      crypto, precio_crypto, precio_eur,
      peso_tier, tamano, envio_precio, comision, neto_eur,
      fotos,
    } = req.body

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.query(
        `INSERT INTO articulos
          (usuario_id, titulo, descripcion, categoria, condicion,
           crypto, precio_crypto, precio_eur,
           peso_tier, tamano, envio_precio, comision, neto_eur)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.usuario.id, titulo, descripcion, categoria, condicion,
          crypto, precio_crypto, precio_eur,
          peso_tier, tamano, envio_precio, comision, neto_eur,
        ]
      )

      const articuloId = result.insertId

      for (let i = 0; i < fotos.length; i++) {
        await conn.query(
          'INSERT INTO articulo_fotos (articulo_id, foto, orden) VALUES (?, ?, ?)',
          [articuloId, fotos[i], i]
        )
      }

      await conn.commit()
      return res.status(201).json({ mensaje: 'Artículo publicado correctamente', id: articuloId })
    } catch (err) {
      await conn.rollback()
      console.error('[POST /articulos]', err)
      return res.status(500).json({ error: 'Error al publicar el artículo' })
    } finally {
      conn.release()
    }
  }
)

// ─── GET /api/articulos ────────────────────────────────────────────────────

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { categoria, condicion, crypto } = req.query

    let where = "WHERE a.estado = 'activo'"
    const params = []

    if (categoria) { where += ' AND a.categoria = ?'; params.push(categoria) }
    if (condicion) { where += ' AND a.condicion = ?'; params.push(condicion) }
    if (crypto)    { where += ' AND a.crypto = ?';    params.push(crypto) }

    const [articulos] = await pool.query(
      `SELECT
         a.id, a.titulo, a.descripcion, a.categoria, a.condicion,
         a.crypto, a.precio_crypto, a.precio_eur, a.estado, a.created_at,
         u.nombre   AS seller,
         u.avatar   AS seller_avatar,
         (SELECT af.foto FROM articulo_fotos af
          WHERE af.articulo_id = a.id
          ORDER BY af.orden LIMIT 1) AS foto_principal
       FROM articulos a
       JOIN usuarios u ON u.id = a.usuario_id
       ${where}
       ORDER BY a.created_at DESC`,
      params
    )

    return res.json({ articulos })
  } catch (err) {
    console.error('[GET /articulos]', err)
    return res.status(500).json({ error: 'Error al obtener los artículos' })
  }
})

module.exports = router
