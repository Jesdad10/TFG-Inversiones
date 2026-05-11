const bcrypt = require('bcryptjs')
const { db, admin } = require('./db')

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@akmarket.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin1234!'
  const nombre = process.env.ADMIN_NOMBRE || 'Admin'

  try {
    const existe = await db
      .collection('usuarios')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existe.empty) {
      console.log('[seed] Admin ya existe')
      return
    }

    const hash = await bcrypt.hash(password, 12)
    const ref = db.collection('usuarios').doc()

    await ref.set({
      id: ref.id,
      nombre,
      email,
      password_hash: hash,
      wallet: null,
      rol: 'admin',

      activo: true,
      bloqueado: false,
      motivo_bloqueo: null,
      bloqueado_en: null,

      fecha_nacimiento: '2000-01-01',
      telefono: null,
      genero: null,
      pais: null,
      ciudad: null,
      direccion: null,
      bio: null,
      avatar: null,

      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`[seed] Admin creado: ${email}`)
  } catch (err) {
    console.error('[seed] Error al crear admin:', err.message)
  }
}

module.exports = seedAdmin