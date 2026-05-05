# 🔫 AK-MARKET

Plataforma web de compraventa de equipamiento de airsoft con pagos en criptomonedas

---

## 📋 Descripción del Proyecto

**AK-MARKET** es una armería online especializada en airsoft que permite a los usuarios **comprar, vender y gestionar equipamiento** — réplicas, accesorios y material táctico — utilizando **criptomonedas** como medio de pago e integrando tecnología **Blockchain** para garantizar la **seguridad, transparencia e inmutabilidad** de las transacciones.

El objetivo principal es ofrecer una experiencia **moderna e intuitiva** de compra para la comunidad airsofter, combinando el comercio electrónico con pagos descentralizados a través de una interfaz **sencilla y accesible**.

---

## ✨ Funcionalidades Implementadas

- 🔐 Registro e inicio de sesión de usuarios (email + contraseña)
- 🎂 Validación de edad en el registro (mayores de 18 años)
- 🔑 Autenticación con tokens JWT (generación, verificación y cierre de sesión)
- 🔒 Encriptación de contraseñas con bcrypt
- 🏠 Dashboard post-login con buscador, filtros por categoría, precio y condición
- 👤 Página de perfil con foto de perfil (subida, previsualización y eliminación)
- 📝 Edición de datos personales: nombre, teléfono, género, fecha de nacimiento, país, ciudad, dirección y biografía
- 🧭 Navbar compartida con menú desplegable de usuario
- 🌐 Interfaz responsive adaptada a móvil y escritorio

## 🚧 Funcionalidades en Desarrollo

- 💰 Compra de equipamiento pagando con criptomonedas
- 🔗 Integración con Blockchain para validar transacciones
- 👛 Conexión con wallet de criptomonedas (MetaMask)
- 📦 Gestión de pedidos e historial de compras
- 🛒 Publicación de artículos para venta
- 📊 Panel de administración

---

## 🛠️ Tecnologías Utilizadas

### 🎨 Frontend

| Tecnología     | Descripción                                                    |
|----------------|----------------------------------------------------------------|
| React 19       | Biblioteca principal para la interfaz                          |
| Vite           | Bundler y entorno de desarrollo rápido                         |
| React Router   | Navegación entre páginas (SPA)                                 |
| CSS            | Estilos y diseño responsive                                    |
| Canvas API     | Redimensionado de imágenes en el cliente antes de subirlas     |
| JWT (cliente)  | Decodificación del token en el frontend para acceso inmediato  |

---

### ⚙️ Backend & Base de Datos

| Tecnología         | Descripción                                      |
|--------------------|--------------------------------------------------|
| Node.js            | Entorno de ejecución del servidor                |
| Express            | Framework para la API REST                       |
| MySQL              | Base de datos relacional                         |
| mysql2             | Conector de MySQL para Node.js                   |
| bcryptjs           | Encriptación de contraseñas                      |
| jsonwebtoken       | Generación y verificación de tokens JWT          |
| express-validator  | Validación de datos en los endpoints             |
| dotenv             | Gestión de variables de entorno                  |
| cors               | Control de acceso entre frontend y backend       |
| nodemon            | Reinicio automático del servidor en desarrollo   |

---

### 🧰 Herramientas

| Herramienta | Descripción                       |
|-------------|-----------------------------------|
| Git         | Control de versiones              |
| GitHub      | Repositorio remoto y colaboración |
| Postman     | Testing de la API                 |

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
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

### ▶️ Backend

```bash
# Entrar en la carpeta backend
cd backend

# Instalar dependencias
npm install

# Iniciar el servidor (con reinicio automático)
npm run dev
```

> ⚠️ Antes de arrancar el backend, configura el archivo `backend/.env` con tus credenciales de MySQL.

Ejemplo de `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=akmarket
JWT_SECRET=una_clave_secreta_larga
JWT_EXPIRES_IN=7d
PORT=3001
```

---

## 🗄️ Base de Datos

### Creación de la base de datos

Ejecuta el siguiente script SQL en tu cliente MySQL (phpMyAdmin, MySQL Workbench, terminal, etc.) para crear la base de datos y todas las tablas necesarias:

```sql
-- Crear base de datos
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
  fecha_nacimiento DATE          NULL,
  telefono         VARCHAR(20)   NULL,
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
```

> Si ya tienes la tabla `usuarios` creada sin las columnas nuevas de perfil, ejecuta solo esta migración:
>
> ```sql
> ALTER TABLE usuarios
>   ADD COLUMN telefono   VARCHAR(20)   NULL,
>   ADD COLUMN pais       VARCHAR(100)  NULL,
>   ADD COLUMN ciudad     VARCHAR(100)  NULL,
>   ADD COLUMN direccion  VARCHAR(255)  NULL,
>   ADD COLUMN genero     VARCHAR(50)   NULL,
>   ADD COLUMN bio        TEXT          NULL,
>   ADD COLUMN avatar     MEDIUMTEXT    NULL;
> ```

---

## 👥 Autores

- **Jesús Orellana**
- **Diego Mancha**

## 📚 Contexto Académico

- Ciclo Formativo: **Desarrollo de Aplicaciones Web (DAW)**
- Tipo de trabajo: **Trabajo de Fin de Grado (TFG)**
- Curso: **2025 / 2026**

---
