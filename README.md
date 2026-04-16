# MediSync Node API - Servicio de Autenticación

## Descripción
API de autenticación con registro e inicio de sesión usando Node.js, Express y MongoDB.

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` con las variables de entorno:
```bash
cp .env.example .env
```

3. Configurar las variables en `.env`:
- `URI`: Conexión a MongoDB
- `JWT_SECRET`: Clave secreta para tokens JWT
- `PORT`: Puerto del servidor (default: 3001)

4. Iniciar el servidor:
```bash
npm start
```

## Rutas de la API

### 1. Registro de Usuario
**POST** `/api/auth/registro`

**Body (JSON):**
```json
{
  "email": "usuario@example.com",
  "password": "miContraseña123",
  "nombre": "Juan Pérez"
}
```

**Respuesta exitosa (201):**
```json
{
  "mensaje": "Registro satisfactorio",
  "usuario": {
    "id": "...",
    "email": "usuario@example.com",
    "nombre": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta error (400/500):**
```json
{
  "error": "El email ya está registrado"
}
```

---

### 2. Inicio de Sesión
**POST** `/api/auth/login`

**Body (JSON):**
```json
{
  "email": "usuario@example.com",
  "password": "miContraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Autenticación satisfactoria",
  "usuario": {
    "id": "...",
    "email": "usuario@example.com",
    "nombre": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta error (401):**
```json
{
  "error": "Error en la autenticación"
}
```

---

## Características

✓ **Registro de usuarios** con validación  
✓ **Inicio de sesión** con autenticación segura  
✓ **Contraseñas hasheadas** con bcryptjs  
✓ **Tokens JWT** para sesiones seguras  
✓ **MongoDB** para persistencia de datos  
✓ **Middleware de autenticación** para proteger rutas

## Estructura del Proyecto

```
medisync-node-api/
├── app.js                 # Archivo principal
├── package.json           # Dependencias
├── .env.example          # Variables de entorno (ejemplo)
├── models/
│   └── User.js           # Modelo de usuario
├── routes/
│   └── auth.js           # Rutas de autenticación
└── middleware/
    └── auth.js           # Middleware de verificación JWT
```

## Notas de Seguridad

- El token JWT expira en 7 días
- Las contraseñas se hashean con bcryptjs (10 rondas)
- Utiliza HTTPS en producción
- Mantén `JWT_SECRET` seguro en variables de entorno
- No compartas tokens con terceros
