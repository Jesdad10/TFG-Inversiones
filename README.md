# 💹 TFG-Inversiones

Plataforma web de inversiones con criptomonedas y tecnología Blockchain

---

## 📋 Descripción del Proyecto

La aplicación permite a los usuarios **comprar, vender y gestionar inversiones** utilizando criptomonedas como medio de pago, integrando tecnología **Blockchain** para garantizar la **seguridad, transparencia e inmutabilidad** de las transacciones.

El objetivo principal es ofrecer una experiencia **moderna e intuitiva** en el mundo de las inversiones digitales, acercando la tecnología descentralizada al usuario final a través de una interfaz **sencilla y accesible**.

---

## ✨ Funcionalidades Implementadas

- 🔐 Registro e inicio de sesión de usuarios
- 🔑 Autenticación con tokens JWT
- 🔒 Encriptación de contraseñas con bcrypt
- 🌐 Interfaz responsive adaptada a móvil y escritorio

## 🚧 Funcionalidades en Desarrollo

- 📊 Dashboard de inversiones con gráficos en tiempo real
- 💰 Compra y venta de activos usando criptomonedas
- 🔗 Integración con Blockchain para validar transacciones
- 👛 Conexión con wallet de criptomonedas (MetaMask)
- 📈 Historial de transacciones y rendimiento de cartera

---

## 🛠️ Tecnologías Utilizadas

### 🎨 Frontend

| Tecnología     | Descripción                                   |
|--------------|----------------------------------------------|
| React        | Biblioteca principal para la interfaz         |
| Vite         | Bundler y entorno de desarrollo rápido       |
| React Router | Navegación entre páginas                     |
| CSS          | Estilos y diseño responsive                  |

---

### ⚙️ Backend & Base de Datos

| Tecnología          | Descripción                                      |
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
|------------|-----------------------------------|
| Git        | Control de versiones              |
| GitHub     | Repositorio remoto y colaboración |
| Postman    | Testing de la API                 |

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

---

## 👥 Autores

- **Jesús Orellana**
- **Diego Mancha**

## 📚 Contexto Académico

- Ciclo Formativo: **Desarrollo de Aplicaciones Web (DAW)**
- Tipo de trabajo: **Trabajo de Fin de Grado (TFG)**
- Curso: **2025 / 2026**

---