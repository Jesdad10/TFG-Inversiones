# Sistema de Autenticación — Explicación Completa

## Índice

1. [Visión general](#1-visión-general)
2. [Tecnologías utilizadas](#2-tecnologías-utilizadas)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [La base de datos](#4-la-base-de-datos)
5. [El flujo del Registro](#5-el-flujo-del-registro)
6. [El flujo del Login](#6-el-flujo-del-login)
7. [Los tokens JWT](#7-los-tokens-jwt)
8. [Las contraseñas y bcrypt](#8-las-contraseñas-y-bcrypt)
9. [El middleware de autenticación](#9-el-middleware-de-autenticación)
10. [Los endpoints disponibles](#10-los-endpoints-disponibles)
11. [El servicio en el frontend](#11-el-servicio-en-el-frontend)

---

## 1. Visión general

El sistema está dividido en dos partes que se comunican mediante peticiones HTTP:

```
NAVEGADOR (React)          SERVIDOR (Node.js)          BASE DE DATOS (MySQL)
      │                          │                              │
      │  ── petición HTTP ──►    │  ── consulta SQL ──►         │
      │                          │                              │
      │  ◄── respuesta JSON ──   │  ◄── resultado ──            │
```

El usuario nunca accede a la base de datos directamente.
Siempre habla con el servidor, y el servidor decide qué hacer y qué devolver.

El frontend corre en `http://localhost:5173`
El backend corre en `http://localhost:3001`

---

## 2. Tecnologías utilizadas

### Frontend
| Tecnología | Función |
|---|---|
| React 19 | Construir los formularios e interfaz de usuario |
| React Router v7 | Navegar entre `/login`, `/register` y `/dashboard` sin recargar |
| CSS puro | Todo el diseño visual (dark theme, animaciones) |
| fetch API | Enviar peticiones HTTP al backend |

### Backend
| Tecnología | Función |
|---|---|
| Node.js | Entorno que ejecuta JavaScript en el servidor |
| Express | Framework que recibe peticiones y envía respuestas |
| bcryptjs | Encriptar contraseñas antes de guardarlas |
| jsonwebtoken | Crear y verificar tokens JWT |
| mysql2 | Conectar y hacer consultas a MySQL |
| express-validator | Validar que los datos del formulario son correctos |
| dotenv | Leer las credenciales del fichero `.env` |
| cors | Permitir que el frontend (5173) hable con el backend (3001) |
| nodemon | Reiniciar el servidor automáticamente al guardar cambios |

---

## 3. Estructura de archivos

```
TFG-Inversiones/
│
├── src/                              FRONTEND (React)
│   ├── pages/
│   │   ├── Login.jsx                 Formulario de inicio de sesión
│   │   ├── Login.css                 Estilos del login
│   │   ├── Register.jsx              Formulario de registro + pantalla de éxito
│   │   └── Register.css              Estilos del registro
│   ├── services/
│   │   └── auth.js                   Funciones para llamar a la API del backend
│   ├── App.jsx                       Configuración de rutas (React Router)
│   └── index.css                     Estilos globales
│
└── backend/                          BACKEND (Node.js + Express)
    ├── .env                          Credenciales: DB, puerto, secreto JWT
    ├── server.js                     Punto de entrada del servidor
    └── src/
        ├── db.js                     Pool de conexiones a MySQL
        ├── middleware/
        │   └── auth.js               Verifica el JWT en rutas protegidas
        └── routes/
            └── auth.js               Todos los endpoints de autenticación
```

---

## 4. La base de datos

Se crearon tres tablas en la base de datos `MarketCripto`:

### Tabla `usuarios`
Almacena los datos de cada usuario registrado.

| Campo | Tipo | Descripción |
|---|---|---|
| id | INT UNSIGNED | Identificador único, se incrementa solo |
| nombre | VARCHAR(100) | Nombre completo del usuario |
| email | VARCHAR(150) | Correo electrónico, único en la tabla |
| password_hash | VARCHAR(255) | Contraseña encriptada con bcrypt |
| wallet | VARCHAR(42) | Dirección MetaMask (0x + 40 caracteres hex), opcional |
| rol | ENUM | `user` o `admin` |
| activo | TINYINT(1) | 1 = activo, 0 = desactivado |
| created_at | DATETIME | Fecha de registro |
| updated_at | DATETIME | Fecha de última modificación |

### Tabla `sesiones`
Almacena los tokens activos de cada usuario. Sirve para poder invalidar sesiones.

| Campo | Tipo | Descripción |
|---|---|---|
| id | INT UNSIGNED | Identificador único |
| usuario_id | INT UNSIGNED | Referencia al usuario (clave foránea) |
| token | VARCHAR(512) | El token JWT completo |
| ip | VARCHAR(45) | IP desde donde se conectó (soporta IPv6) |
| user_agent | VARCHAR(255) | Navegador / dispositivo del usuario |
| expira_en | DATETIME | Cuándo expira el token |
| created_at | DATETIME | Cuándo se creó la sesión |

### Tabla `recuperacion_password`
Guarda tokens temporales para el proceso de "¿Olvidaste tu contraseña?".

| Campo | Tipo | Descripción |
|---|---|---|
| id | INT UNSIGNED | Identificador único |
| usuario_id | INT UNSIGNED | Referencia al usuario |
| token | VARCHAR(255) | Token único de recuperación |
| usado | TINYINT(1) | 0 = sin usar, 1 = ya utilizado |
| expira_en | DATETIME | Cuándo caduca el enlace de recuperación |
| created_at | DATETIME | Cuándo se generó |

---

## 5. El flujo del Registro

Este es el recorrido completo cuando un usuario se registra:

```
1. El usuario rellena el formulario en Register.jsx
   (nombre, email, contraseña, confirmar contraseña)

2. VALIDACIONES EN EL FRONTEND (Register.jsx)
   ┌─ ¿Las contraseñas coinciden?       → si no → muestra error rojo
   └─ ¿Aceptó los términos?             → si no → botón desactivado

3. Si pasa las validaciones, se llama a authService.register()
   que hace:
   POST http://localhost:3001/api/auth/register
   Body: { nombre, email, password }

4. VALIDACIONES EN EL BACKEND (express-validator)
   ┌─ ¿El nombre no está vacío?
   ├─ ¿El email tiene formato válido?
   └─ ¿La contraseña tiene 8+ caracteres?
   → Si falla → responde 422 con el mensaje de error

5. CONSULTA A MYSQL — ¿El email ya existe?
   SELECT id FROM usuarios WHERE email = ?
   ┌─ SÍ existe → responde 409 "El email ya está registrado"
   └─ NO existe → continúa

6. BCRYPT — Encripta la contraseña
   "miPassword123"  →  "$2a$12$X9r4qL8K2pN7mJ..."
   El número 12 es el "coste" (cuántas veces se repite el algoritmo)

7. INSERT en tabla usuarios
   INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)
   MySQL devuelve el ID del nuevo usuario (ej: id = 5)

8. JWT — Genera el token de sesión
   jwt.sign({ id: 5, email, rol: 'user' }, SECRET, { expiresIn: '7d' })

9. INSERT en tabla sesiones
   INSERT INTO sesiones (usuario_id, token, ip, expira_en) VALUES (...)
   El token queda registrado para poder invalidarlo en el logout

10. El backend responde 201 con:
    { token, usuario: { id, nombre, email, rol } }

11. EL FRONTEND recibe la respuesta
    localStorage.setItem('token', token)  → guarda el token en el navegador

12. PANTALLA DE ÉXITO
    Aparece el mensaje "¡Cuenta creada! Bienvenido, [nombre]"
    con una barra de progreso que dura 3 segundos

13. Redirección automática a /dashboard
```

---

## 6. El flujo del Login

Recorrido completo cuando un usuario inicia sesión:

```
1. El usuario introduce email y contraseña en Login.jsx

2. Se llama a authService.login() que hace:
   POST http://localhost:3001/api/auth/login
   Body: { email, password }

3. VALIDACIONES EN EL BACKEND (express-validator)
   ┌─ ¿El email tiene formato válido?
   └─ ¿La contraseña no está vacía?

4. CONSULTA A MYSQL — Buscar el usuario
   SELECT id, nombre, email, password_hash, rol, activo
   FROM usuarios WHERE email = ?

   ┌─ No existe → responde 401 "Credenciales incorrectas"
   │   (mismo mensaje que si la contraseña es incorrecta,
   │    así no revelamos si el email existe o no → seguridad)
   └─ Existe → continúa

5. ¿La cuenta está activa?
   ┌─ activo = 0 → responde 403 "Cuenta desactivada"
   └─ activo = 1 → continúa

6. BCRYPT — Compara la contraseña introducida con el hash guardado
   bcrypt.compare("miPassword123", "$2a$12$X9r4qL8K2pN7mJ...")
   ┌─ NO coinciden → responde 401 "Credenciales incorrectas"
   └─ SÍ coinciden → continúa

7. JWT + sesión — igual que en el registro:
   Genera token → inserta en tabla sesiones

8. El backend responde 200 con:
   { token, usuario: { id, nombre, email, rol } }

9. El frontend guarda el token y redirige al dashboard
```

---

## 7. Los tokens JWT

Un JWT (JSON Web Token) es una cadena de texto con tres partes separadas por puntos:

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.Xk7vB2mQpL...
        │                              │                                  │
   CABECERA                       PAYLOAD                             FIRMA
(algoritmo usado)          (datos que contiene)              (garantiza autenticidad)
```

Si decodificas el PAYLOAD verías:
```json
{
  "id": 5,
  "email": "usuario@email.com",
  "rol": "user",
  "iat": 1746000000,
  "exp": 1746604800
}
```

- `iat` = issued at (cuándo se creó, en segundos Unix)
- `exp` = expiration (cuándo expira, en segundos Unix)

### ¿Por qué usamos JWT?

**Sistema clásico de sesiones (sin JWT):**
- El servidor guarda en memoria "el usuario 5 está conectado"
- Si el servidor se reinicia → sesión perdida
- No escala con varios servidores

**Con JWT:**
- El servidor genera el token y en teoría lo puede olvidar
- El cliente guarda el token y lo envía en cada petición
- El servidor solo verifica la firma matemática para saber quién eres
- Funciona con cualquier número de servidores

### ¿Por qué también guardamos el token en MySQL?

El JWT puro tiene un problema grave: **no se puede invalidar antes de que expire**.
Si alguien roba tu token, podría usarlo durante 7 días sin que puedas hacer nada.

Al guardar el token en la tabla `sesiones`, el logout hace:
```sql
DELETE FROM sesiones WHERE token = ?
```
Aunque alguien tenga el token, el middleware comprueba si existe en la base de datos
y si no está → acceso denegado.

### ¿Cómo viaja el token en cada petición?

El frontend lo añade en la cabecera `Authorization`:
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### ¿Dónde se guarda el token en el navegador?

```javascript
localStorage.setItem('token', token)
```

El `localStorage` es un almacén del navegador que persiste aunque cierres la pestaña.
Cuando el usuario hace logout:
```javascript
localStorage.removeItem('token')
```

---

## 8. Las contraseñas y bcrypt

**Por qué nunca se guarda la contraseña en texto plano:**

Si alguien hackeara la base de datos y las contraseñas estuvieran en texto plano,
tendría acceso a las cuentas de todos los usuarios (y posiblemente a sus otras cuentas,
ya que mucha gente reutiliza contraseñas).

**Cómo funciona bcrypt:**

```
"miPassword123"  →  bcrypt.hash(password, 12)  →  "$2a$12$X9r4qL8K2pN7mJ3vR5tOu..."
```

- El `12` es el factor de coste — el algoritmo se repite 2^12 = 4096 veces
- Cuanto más alto el coste, más lento (y más seguro)
- bcrypt añade un "salt" aleatorio, por eso el hash es diferente cada vez aunque
  la contraseña sea la misma

**Comparación al hacer login:**
```javascript
bcrypt.compare("miPassword123", "$2a$12$X9r4qL8K2pN7mJ3vR5tOu...")
// devuelve true o false
```

bcrypt **no descifra** el hash. Vuelve a hashear la contraseña introducida con el mismo
salt y compara. Es un proceso de un solo sentido: **imposible revertir**.

---

## 9. El middleware de autenticación

El middleware es una función que se ejecuta **antes** de que llegue la petición
a la ruta protegida. Si el token no es válido, la petición se corta ahí.

```javascript
// middleware/auth.js

async function authMiddleware(req, res, next) {

  // 1. ¿Viene la cabecera Authorization?
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  // 2. Extrae el token
  const token = header.split(' ')[1]

  try {
    // 3. ¿La firma es válida? (verifica matemáticamente)
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // 4. ¿El token existe en la tabla sesiones y no ha expirado?
    const [rows] = await pool.query(
      'SELECT id FROM sesiones WHERE token = ? AND expira_en > NOW()',
      [token]
    )
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada o inválida' })
    }

    // 5. Todo OK → añade los datos del usuario al request y continúa
    req.usuario = payload
    next()

  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
```

Para proteger una ruta se usa como segundo parámetro:
```javascript
router.get('/me', authMiddleware, async (req, res) => {
  // Solo llega aquí si el token es válido
  // req.usuario tiene { id, email, rol }
})
```

---

## 10. Los endpoints disponibles

### POST `/api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{ "nombre": "Juan García", "email": "juan@email.com", "password": "MiPass123!" }
```
**Respuesta 201:**
```json
{
  "mensaje": "Usuario registrado correctamente",
  "token": "eyJhbGci...",
  "usuario": { "id": 5, "nombre": "Juan García", "email": "juan@email.com", "rol": "user" }
}
```

---

### POST `/api/auth/login`
Inicia sesión con email y contraseña.

**Body:**
```json
{ "email": "juan@email.com", "password": "MiPass123!" }
```
**Respuesta 200:**
```json
{
  "mensaje": "Login correcto",
  "token": "eyJhbGci...",
  "usuario": { "id": 5, "nombre": "Juan García", "email": "juan@email.com", "rol": "user" }
}
```

---

### POST `/api/auth/login-wallet`
Inicia sesión con una dirección de MetaMask.

**Body:**
```json
{ "wallet": "0xAbCd1234..." }
```

---

### POST `/api/auth/logout`
Cierra la sesión e invalida el token en la base de datos.

**Cabecera requerida:**
```
Authorization: Bearer eyJhbGci...
```
**Respuesta 200:**
```json
{ "mensaje": "Sesión cerrada correctamente" }
```

---

### GET `/api/auth/me`
Devuelve los datos del usuario autenticado.

**Cabecera requerida:**
```
Authorization: Bearer eyJhbGci...
```
**Respuesta 200:**
```json
{
  "usuario": {
    "id": 5,
    "nombre": "Juan García",
    "email": "juan@email.com",
    "wallet": null,
    "rol": "user",
    "created_at": "2025-04-30T13:00:00.000Z"
  }
}
```

---

## 11. El servicio en el frontend

El fichero `src/services/auth.js` centraliza todas las llamadas a la API para que
los componentes no tengan que saber cómo funciona la comunicación con el backend.

```javascript
// Cómo lo usa Login.jsx
const data = await authService.login(email, password)
authService.guardarSesion(data.token)
navigate('/dashboard')

// Cómo lo usa Register.jsx
const data = await authService.register(nombre, email, password)
authService.guardarSesion(data.token)

// Logout desde cualquier componente
await authService.logout()
navigate('/login')

// Comprobar si hay sesión activa
if (authService.estaLogueado()) {
  // el usuario tiene token guardado
}
```

---

## Resumen del flujo completo

```
USUARIO                  FRONTEND                  BACKEND                  MYSQL
   │                        │                          │                       │
   │── rellena formulario ──►│                          │                       │
   │                        │── POST /register ────────►│                       │
   │                        │                          │── SELECT email ───────►│
   │                        │                          │◄── no existe ──────────│
   │                        │                          │── bcrypt.hash() ────── │
   │                        │                          │── INSERT usuario ──────►│
   │                        │                          │── jwt.sign() ──────────│
   │                        │                          │── INSERT sesion ───────►│
   │                        │◄── 201 { token, user } ──│                       │
   │                        │── localStorage(token) ───│                       │
   │◄── pantalla de éxito ──│                          │                       │
   │◄── redirige /dashboard │                          │                       │
```

---

*Documento generado para el TFG-Inversiones — DAW 2025/2026*
*Autores: Jesús Orellana · Diego Mancha*