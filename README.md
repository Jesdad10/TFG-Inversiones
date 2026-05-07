# 🔫 AK-MARKET

Plataforma web de compraventa de equipamiento de airsoft con pagos en criptomonedas

---

## 📋 Descripción del Proyecto

**AK-MARKET** es una armería online especializada en airsoft que permite a los usuarios **comprar, vender y gestionar equipamiento** — réplicas, accesorios y material táctico — utilizando **criptomonedas** como medio de pago e integrando tecnología **Blockchain** para garantizar la **seguridad, transparencia e inmutabilidad** de las transacciones.

El objetivo principal es ofrecer una experiencia **moderna e intuitiva** de compra para la comunidad airsofter, combinando el comercio electrónico con pagos descentralizados a través de una interfaz **sencilla y accesible**.

---

## ✨ Funcionalidades Implementadas

### 🔐 Autenticación y Usuarios
- Registro con validación de edad (mayores de 18 años obligatorio)
- Inicio de sesión con email + contraseña
- Inicio de sesión con wallet de criptomonedas (MetaMask — estructura lista)
- Autenticación con tokens JWT (generación, verificación y cierre de sesión)
- Sesiones persistidas en base de datos con fecha de expiración
- Encriptación de contraseñas con bcrypt
- Cierre de sesión con invalidación del token en BD

### 👤 Perfil de Usuario
- Foto de perfil: subida, previsualización y eliminación
- Redimensionado automático de imagen en el cliente (Canvas API) antes de enviarla
- Edición de datos personales: nombre, teléfono con prefijo internacional, género, fecha de nacimiento, país, ciudad, dirección y biografía
- El número de teléfono se guarda con el prefijo de país (`+34 600000000`)
- Aviso de cambios sin guardar al navegar fuera del perfil (modal de confirmación)

### 🛒 Marketplace
- Dashboard con catálogo de artículos reales cargados desde la API
- Buscador y filtros por categoría, precio y condición
- Publicación de artículos con múltiples fotos, descripción y precio
- Precios en ETH o BTC con estimación automática en euros
- Cálculo de tiers de envío por peso y tamaño
- Comisión del 3% con resumen de ingresos netos
- Guardado de artículos en BD con transacciones SQL atómicas
- Página "Mis productos": listado propio con foto, estado, precio y fecha
- Eliminación de artículos propios con modal de confirmación

### 🛡️ Panel Administrativo
Accesible únicamente para usuarios con rol `admin`. Visible en el menú desplegable de la Navbar solo para administradores.

- **Resumen** — estadísticas generales: total de usuarios, bloqueados, admins, productos activos y totales; gráfico de barras con altas de usuarios por mes (últimos 12 meses)
- **Gestión de usuarios** — listado completo con búsqueda; acciones por usuario:
  - Bloquear con motivo opcional → el usuario ve "Usuario bloqueado temporalmente, contacte con soporte" al intentar iniciar sesión
  - Desbloquear
  - Cambiar rol (`user` ↔ `admin`) con verificación de contraseña del admin
  - Eliminar (soft-delete: desaparece de la lista activa, visible en sección de usuarios eliminados)
- **Crear usuario** — el admin crea cuentas nuevas con rol `user` o `admin` directamente desde el panel
- **Gestión de productos** — el admin ve todos los artículos (activos, vendidos y eliminados), puede filtrar por estado y eliminar cualquier producto con motivo opcional; el vendedor recibe una notificación automática
- **Historial de acciones** — registro de auditoría de todas las acciones del admin (bloqueos, eliminaciones, cambios de rol, creaciones) con fecha y detalle
- **Chat de soporte** — botón visible, funcionalidad pendiente de implementar

### 🔔 Notificaciones
- Sistema de notificaciones en tiempo real en la Navbar (campana con badge de no leídas)
- Tipos: producto eliminado por admin, cuenta bloqueada, sistema
- Marcar como leída individualmente o todas a la vez
- Desplegable con icono por tipo, mensaje y fecha

### 🔒 Seguridad
- Contraseñas hasheadas con bcrypt (compatibilidad `$2a$` / `$2b$`)
- Tokens JWT verificados en cada petición contra la tabla de sesiones
- Middleware de rol: rutas de admin protegidas con verificación `rol === 'admin'`
- Validación de inputs en el backend con `express-validator`
- Detección de cuenta bloqueada en el login con mensaje diferenciado
- Seed automático al arrancar el servidor: crea el primer admin si no existe

### 🌐 Interfaz
- Navbar compartida con menú desplegable de usuario
- Diseño responsive adaptado a móvil y escritorio
- Tema oscuro consistente (negro y rojo)

---

## 🚧 Funcionalidades en Desarrollo

- 💰 Compra de equipamiento pagando con criptomonedas (ETH / BTC)
- 🔗 Integración con Blockchain para validar transacciones
- 👛 Conexión completa con wallet MetaMask
- 📦 Gestión de pedidos e historial de compras
- 💬 Chat de soporte admin-usuario en tiempo real

---

## 🛠️ Tecnologías Utilizadas

### 🎨 Frontend

| Tecnología    | Descripción                                                   |
|---------------|---------------------------------------------------------------|
| React 19      | Biblioteca principal para la interfaz                         |
| Vite          | Bundler y entorno de desarrollo rápido                        |
| React Router  | Navegación entre páginas (SPA)                                |
| CSS           | Estilos y diseño responsive                                   |
| Canvas API    | Redimensionado de imágenes en el cliente antes de subirlas    |
| JWT (cliente) | Decodificación del token en el frontend para acceso inmediato |

### ⚙️ Backend & Base de Datos

| Tecnología        | Descripción                                    |
|-------------------|------------------------------------------------|
| Node.js           | Entorno de ejecución del servidor              |
| Express 5         | Framework para la API REST                     |
| MySQL             | Base de datos relacional                       |
| mysql2            | Conector de MySQL para Node.js                 |
| bcryptjs          | Encriptación de contraseñas                    |
| jsonwebtoken      | Generación y verificación de tokens JWT        |
| express-validator | Validación de datos en los endpoints           |
| dotenv            | Gestión de variables de entorno                |
| cors              | Control de acceso entre frontend y backend     |
| nodemon           | Reinicio automático del servidor en desarrollo |

### 🧰 Herramientas

| Herramienta     | Descripción                       |
|-----------------|-----------------------------------|
| Git             | Control de versiones              |
| GitHub          | Repositorio remoto y colaboración |
| MySQL Workbench | Gestión visual de la base de datos|
| Postman         | Testing de la API                 |

---

## 📁 Estructura del Proyecto

```
TFG-Inversiones/
├── src/
│   ├── pages/
│   │   ├── Login.jsx / Login.css
│   │   ├── Register.jsx / Register.css
│   │   ├── Dashboard.jsx / Dashboard.css
│   │   ├── Profile.jsx / Profile.css
│   │   ├── Vender.jsx / Vender.css
│   │   ├── MisProductos.jsx / MisProductos.css
│   │   └── AdminPanel.jsx / AdminPanel.css
│   ├── components/
│   │   └── Navbar.jsx / Navbar.css
│   ├── services/
│   │   ├── auth.js        (auth + admin + notificaciones)
│   │   └── articulos.js
│   ├── App.jsx
│   └── main.jsx
└── backend/
    ├── src/
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── articulos.js
    │   │   ├── admin.js
    │   │   └── notificaciones.js
    │   ├── middleware/
    │   │   ├── auth.js
    │   │   └── admin.js
    │   ├── db.js
    │   └── seed.js
    ├── server.js
    └── .env
```

---

## 🔌 API Endpoints

### Auth — `/api/auth`

| Método | Ruta            | Descripción                          | Auth |
|--------|-----------------|--------------------------------------|------|
| POST   | `/register`     | Registrar usuario (valida edad ≥ 18) | No   |
| POST   | `/login`        | Login con email y contraseña         | No   |
| POST   | `/login-wallet` | Login con wallet blockchain          | No   |
| POST   | `/logout`       | Cerrar sesión e invalidar token      | Sí   |
| GET    | `/me`           | Obtener perfil del usuario actual    | Sí   |
| PUT    | `/me`           | Actualizar perfil del usuario actual | Sí   |

### Artículos — `/api/articulos`

| Método | Ruta    | Descripción                                  | Auth |
|--------|---------|----------------------------------------------|------|
| POST   | `/`     | Publicar nuevo artículo con fotos            | Sí   |
| GET    | `/`     | Listar artículos activos (con filtros)       | No   |
| GET    | `/mis`  | Listar artículos propios del usuario         | Sí   |
| DELETE | `/:id`  | Eliminar artículo propio (soft-delete)       | Sí   |

### Admin — `/api/admin` *(requiere rol admin)*

| Método | Ruta                          | Descripción                                    |
|--------|-------------------------------|------------------------------------------------|
| GET    | `/stats`                      | Estadísticas y gráfico de altas por mes        |
| GET    | `/usuarios`                   | Listar todos los usuarios                      |
| POST   | `/usuarios`                   | Crear nuevo usuario                            |
| PUT    | `/usuarios/:id/bloquear`      | Bloquear usuario con motivo opcional           |
| PUT    | `/usuarios/:id/desbloquear`   | Desbloquear usuario                            |
| PUT    | `/usuarios/:id/rol`           | Cambiar rol (requiere contraseña del admin)    |
| DELETE | `/usuarios/:id`               | Eliminar usuario (soft-delete)                 |
| GET    | `/articulos`                  | Listar todos los artículos incluidos eliminados|
| DELETE | `/articulos/:id`              | Eliminar artículo con motivo + notificación    |
| GET    | `/historial`                  | Historial de acciones del admin                |

### Notificaciones — `/api/notificaciones` *(requiere auth)*

| Método | Ruta           | Descripción                              |
|--------|----------------|------------------------------------------|
| GET    | `/`            | Obtener notificaciones del usuario       |
| PUT    | `/:id/leer`    | Marcar notificación como leída           |
| PUT    | `/leer-todas`  | Marcar todas las notificaciones como leídas |

---

## 🚀 Instalación y Uso

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jesdad10/TFG-Inversiones.git

# 2. Entrar en el directorio
cd TFG-Inversiones
```

### ▶️ Frontend

```bash
npm install
npm run dev
```

### ▶️ Backend

```bash
cd backend
npm install
npm run dev
```

> ⚠️ Configura `backend/.env` antes de arrancar el servidor.

### 📄 Variables de entorno (`backend/.env`)

```env
PORT=3001

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_base_de_datos

JWT_SECRET=una_clave_secreta_larga_y_segura
JWT_EXPIRES_IN=7d

# Credenciales del primer admin (se crea automáticamente al arrancar)
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD="TuContraseñaSegura"
ADMIN_NOMBRE=Admin
```

> El servidor crea automáticamente el usuario admin al arrancar si no existe. Las credenciales se leen del `.env` y nunca se exponen en el código fuente.

---

## 🗄️ Base de Datos

### Creación completa desde cero

```sql
CREATE DATABASE IF NOT EXISTS akmarket
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE akmarket;

-- ── Tabla de usuarios ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT           NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(100)  NOT NULL,
  email            VARCHAR(150)  NOT NULL,
  password_hash    VARCHAR(255)  NULL,
  wallet           VARCHAR(100)  NULL,
  rol              ENUM('user','admin') NOT NULL DEFAULT 'user',
  activo           TINYINT(1)    NOT NULL DEFAULT 1,
  bloqueado        TINYINT(1)    NOT NULL DEFAULT 0,
  motivo_bloqueo   TEXT          NULL,
  bloqueado_en     TIMESTAMP     NULL,
  fecha_nacimiento DATE          NULL,
  telefono         VARCHAR(30)   NULL,
  genero           VARCHAR(50)   NULL,
  pais             VARCHAR(100)  NULL,
  ciudad           VARCHAR(100)  NULL,
  direccion        VARCHAR(255)  NULL,
  bio              TEXT          NULL,
  avatar           MEDIUMTEXT    NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email  (email),
  UNIQUE KEY uq_wallet (wallet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de sesiones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id          INT          NOT NULL AUTO_INCREMENT,
  usuario_id  INT          NOT NULL,
  token       TEXT         NOT NULL,
  ip          VARCHAR(45)  NULL,
  user_agent  TEXT         NULL,
  expira_en   DATETIME     NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de artículos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articulos (
  id                    INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  usuario_id            INT               NOT NULL,
  titulo                VARCHAR(80)       NOT NULL,
  descripcion           TEXT              NOT NULL,
  categoria             VARCHAR(40)       NOT NULL,
  condicion             VARCHAR(20)       NOT NULL,
  crypto                ENUM('ETH','BTC') NOT NULL,
  precio_crypto         DECIMAL(18,8)     NOT NULL,
  precio_eur            DECIMAL(10,2)     DEFAULT NULL,
  peso_tier             VARCHAR(20)       DEFAULT NULL,
  tamano                VARCHAR(20)       DEFAULT NULL,
  envio_precio          DECIMAL(8,2)      DEFAULT NULL,
  comision              DECIMAL(8,2)      DEFAULT NULL,
  neto_eur              DECIMAL(10,2)     DEFAULT NULL,
  estado                ENUM('activo','vendido','eliminado') NOT NULL DEFAULT 'activo',
  eliminado_por_admin   TINYINT(1)        NOT NULL DEFAULT 0,
  motivo_eliminacion    TEXT              NULL,
  admin_eliminador_id   INT               NULL,
  eliminado_admin_en    TIMESTAMP         NULL,
  created_at            DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_estado   (estado),
  KEY idx_usuario  (usuario_id),
  CONSTRAINT fk_art_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de fotos de artículos ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articulo_fotos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  articulo_id INT UNSIGNED NOT NULL,
  foto        LONGTEXT     NOT NULL,
  orden       TINYINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_articulo (articulo_id),
  CONSTRAINT fk_foto_articulo FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de notificaciones ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          INT          NOT NULL AUTO_INCREMENT,
  usuario_id  INT          NOT NULL,
  tipo        ENUM('producto_eliminado','cuenta_bloqueada','sistema') NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  mensaje     TEXT         NOT NULL,
  leida       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_usuario (usuario_id),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Historial de acciones del administrador ───────────────────────────────
CREATE TABLE IF NOT EXISTS historial_admin (
  id           INT  NOT NULL AUTO_INCREMENT,
  admin_id     INT  NOT NULL,
  accion       ENUM(
                 'eliminar_usuario',
                 'bloquear_usuario',
                 'desbloquear_usuario',
                 'eliminar_producto',
                 'crear_usuario',
                 'cambiar_rol'
               ) NOT NULL,
  entidad_tipo ENUM('usuario','producto') NOT NULL,
  entidad_id   INT  NOT NULL,
  detalle      TEXT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hist_admin (admin_id),
  CONSTRAINT fk_hist_admin FOREIGN KEY (admin_id)
    REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de chats de soporte (estructura para uso futuro) ────────────────
CREATE TABLE IF NOT EXISTS chats (
  id          INT  NOT NULL AUTO_INCREMENT,
  admin_id    INT  NOT NULL,
  usuario_id  INT  NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_chat_admin   FOREIGN KEY (admin_id)   REFERENCES usuarios(id),
  CONSTRAINT fk_chat_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabla de mensajes de chat ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes (
  id         INT  NOT NULL AUTO_INCREMENT,
  chat_id    INT  NOT NULL,
  autor_id   INT  NOT NULL,
  mensaje    TEXT NOT NULL,
  leido      TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_msg_chat (chat_id),
  CONSTRAINT fk_msg_chat  FOREIGN KEY (chat_id)  REFERENCES chats(id)  ON DELETE CASCADE,
  CONSTRAINT fk_msg_autor FOREIGN KEY (autor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Descripción de tablas

| Tabla            | Descripción                                                        |
|------------------|--------------------------------------------------------------------|
| `usuarios`       | Datos de usuario, autenticación, perfil, rol y estado de bloqueo  |
| `sesiones`       | Tokens JWT activos con IP, user-agent y fecha de expiración        |
| `articulos`      | Productos publicados con precio crypto, estado y datos de envío    |
| `articulo_fotos` | Imágenes asociadas a cada artículo (múltiples por artículo)        |
| `notificaciones` | Avisos al usuario: productos eliminados, bloqueos, sistema         |
| `historial_admin`| Registro de auditoría de todas las acciones de los administradores |
| `chats`          | Conversaciones de soporte admin-usuario (pendiente de implementar) |
| `mensajes`       | Mensajes dentro de cada conversación de soporte                    |

---

## 🔑 Primer Administrador

Al arrancar el servidor por primera vez, el seed crea automáticamente el usuario admin definido en `.env`. Si el usuario ya existe, no se modifica nada.

Para **promover un usuario registrado** a admin sin tocar el seed:
```sql
UPDATE usuarios SET rol = 'admin' WHERE email = 'tu@email.com';
```

---

## 👥 Autores

- **Jesús Orellana**
- **Diego Mancha**

## 📚 Contexto Académico

- Ciclo Formativo: **Desarrollo de Aplicaciones Web (DAW)**
- Tipo de trabajo: **Trabajo de Fin de Grado (TFG)**
- Curso: **2025 / 2026**

---
