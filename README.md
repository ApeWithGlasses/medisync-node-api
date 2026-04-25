# MediSync Node API

API RESTful integral para gestión de citas médicas, pacientes, doctores y administración del sistema.

## Tabla de Contenidos

- [Instalación](#instalación)
- [Arquitectura](#arquitectura)
- [Autenticación](#autenticación)
- [Sistema de Roles](#sistema-de-roles)
- [Endpoints](#endpoints)
- [Ejemplos de Workflows](#ejemplos-de-workflows)
- [Seguridad](#seguridad)
- [Modelos de Datos](#modelos-de-datos)

## Instalación

### Requisitos Previos

- Node.js 14+
- MongoDB Atlas (o instancia local)
- npm o yarn

### Pasos

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

3. **Editar `.env` con tus valores:**
```
URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/medisync
JWT_SECRET=tu_clave_muy_secreta_aqui
PORT=3001
```

4. **Iniciar servidor:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

---

## Arquitectura

### Base de Datos

```
MongoDB Collections:
├── users           → Autenticación y control de acceso
├── patients        → Datos de pacientes
├── doctors         → Datos de médicos
└── appointments    → Citas médicas
```

### Estructura de Carpetas

```
medisync-node-api/
├── app.js                  # Servidor Express principal
├── package.json
├── .env.example
├── models/                 # Esquemas MongoDB
│   ├── User.js            # {email, password, rol, activo}
│   ├── Patient.js         # {usuario, identificación, contacto...}
│   ├── Doctor.js          # {usuario, especialidad, horarios...}
│   └── Appointment.js     # {paciente, doctor, fecha, estado...}
├── routes/                 # Endpoints de la API
│   ├── auth.js            # /api/auth → Registro y login
│   ├── patients.js        # /api/patients → CRUD pacientes
│   ├── doctors.js         # /api/doctors → CRUD doctores
│   ├── appointments.js    # /api/appointments → Citas
│   └── admin.js           # /api/admin → Administración
└── middleware/
    └── auth.js            # Verificación JWT y roles
```

---

## Autenticación

### Headers Requeridos

Todos los endpoints (excepto registro/login) requieren:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token JWT

- **Tipo:** HS256
- **Expiración:** 7 días
- **Payload:** `{userId, iat, exp}`

### Obtener Token

1. Registro: `POST /api/auth/registro`
2. Login: `POST /api/auth/login`

---

## Sistema de Roles

### Tres Roles Disponibles

**1. PACIENTE**

```
Permisos:
- Ver/actualizar su perfil
- Agendar citas
- Ver sus citas
- Cancelar sus citas
- Reprogramar sus citas
```

**2. DOCTOR**

```
Permisos:
- Ver/actualizar su perfil
- Ver sus citas asignadas
- Registrar diagnóstico/tratamiento
- Marcar cita como completada
```

**3. ADMIN**

```
Permisos:
- CRUD completo de pacientes
- CRUD completo de doctores
- CRUD completo de citas
- Gestionar usuarios (rol, estado)
- Ver estadísticas del sistema
```

---

## Endpoints

### 1. AUTENTICACIÓN - `/api/auth`

#### Registro

```http
POST /api/auth/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Registro satisfactorio",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "email": "juan@example.com",
    "nombre": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "miPassword123"
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Autenticación satisfactoria",
  "usuario": {
    "id": "507f1f77bcf86cd799439011",
    "email": "juan@example.com",
    "nombre": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. PACIENTES - `/api/patients`

#### Obtener Mi Perfil (Paciente)

```http
GET /api/patients/mi-perfil
Authorization: Bearer <token>
```

#### Completar Perfil (Paciente)

```http
POST /api/patients/completar-perfil
Authorization: Bearer <token>
Content-Type: application/json

{
  "numeroIdentificacion": "1234567890",
  "tipoIdentificacion": "CC",
  "telefono": "3001234567",
  "direccion": "Calle 1 #1",
  "ciudad": "Bogotá",
  "fechaNacimiento": "1990-01-15T00:00:00Z",
  "genero": "M",
  "historiaMedica": "Sin antecedentes",
  "alergias": "Penicilina"
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Perfil completado satisfactoriamente",
  "paciente": {
    "_id": "...",
    "usuario": {
      "email": "juan@example.com",
      "nombre": "Juan Pérez"
    },
    "numeroIdentificacion": "1234567890",
    "telefono": "3001234567",
    "ciudad": "Bogotá"
  }
}
```

#### Actualizar Mi Perfil (Paciente)

```http
PUT /api/patients/mi-perfil
Authorization: Bearer <token>
Content-Type: application/json

{
  "telefono": "3001234567",
  "direccion": "Calle 1 #1",
  "ciudad": "Bogotá",
  "historiaMedica": "Sin restricciones",
  "alergias": "Penicilina"
}
```

#### Crear Paciente (Admin)

```http
POST /api/patients
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "usuarioId": "507f1f77bcf86cd799439011",
  "numeroIdentificacion": "1234567890",
  "tipoIdentificacion": "CC",
  "telefono": "3001234567",
  "direccion": "Calle 1 #1",
  "ciudad": "Bogotá",
  "fechaNacimiento": "1990-01-15T00:00:00Z",
  "genero": "M",
  "historiaMedica": "Sin antecedentes",
  "alergias": "Penicilina"
}
```

#### Obtener Todos los Pacientes (Admin)

```http
GET /api/patients
Authorization: Bearer <token_admin>
```

#### Obtener Paciente por ID (Admin)

```http
GET /api/patients/:id
Authorization: Bearer <token_admin>
```

#### Actualizar Paciente (Admin)

```http
PUT /api/patients/:id
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "telefono": "3009876543",
  "direccion": "Calle 2 #2",
  "ciudad": "Medellín"
}
```

#### Eliminar Paciente (Admin)

```http
DELETE /api/patients/:id
Authorization: Bearer <token_admin>
```

---

### 3. DOCTORES - `/api/doctors`

#### Obtener Mi Perfil (Doctor)

```http
GET /api/doctors/mi-perfil
Authorization: Bearer <token_doctor>
```

#### Completar Perfil (Doctor)

```http
POST /api/doctors/completar-perfil
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "numeroIdentificacion": "1234567890",
  "especialidad": "Cardiología",
  "numeroConsultorio": "101",
  "telefonoConsultorio": "5551234567",
  "licenciaProfesional": "MED123456",
  "horarioAtencion": {
    "lunes": {"inicio": "08:00", "fin": "17:00"},
    "martes": {"inicio": "08:00", "fin": "17:00"},
    "miercoles": {"inicio": "08:00", "fin": "17:00"},
    "jueves": {"inicio": "08:00", "fin": "17:00"},
    "viernes": {"inicio": "08:00", "fin": "17:00"},
    "sabado": {"inicio": "09:00", "fin": "13:00"},
    "domingo": {"inicio": "00:00", "fin": "00:00"}
  },
  "duracionConsulta": 30
}
```

**Respuesta (200):**
```json
{
  "mensaje": "Perfil completado satisfactoriamente",
  "doctor": {
    "_id": "...",
    "usuario": {
      "email": "doctor@example.com",
      "nombre": "Dr. Carlos López"
    },
    "especialidad": "Cardiología",
    "numeroConsultorio": "101"
  }
}
```

#### Actualizar Mi Perfil (Doctor)

```http
PUT /api/doctors/mi-perfil
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "telefonoConsultorio": "5551234567",
  "duracionConsulta": 45,
  "disponible": true,
  "horarioAtencion": {
    "lunes": {"inicio": "08:00", "fin": "17:00"},
    "martes": {"inicio": "08:00", "fin": "17:00"}
  }
}
```

#### Crear Doctor (Admin)

```http
POST /api/doctors
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "usuarioId": "507f1f77bcf86cd799439011",
  "numeroIdentificacion": "1234567890",
  "especialidad": "Cardiología",
  "numeroConsultorio": "101",
  "telefonoConsultorio": "5551234567",
  "horarioAtencion": {
    "lunes": {"inicio": "08:00", "fin": "17:00"},
    "martes": {"inicio": "08:00", "fin": "17:00"},
    "miercoles": {"inicio": "08:00", "fin": "17:00"},
    "jueves": {"inicio": "08:00", "fin": "17:00"},
    "viernes": {"inicio": "08:00", "fin": "17:00"},
    "sabado": {"inicio": "09:00", "fin": "13:00"},
    "domingo": {"inicio": "00:00", "fin": "00:00"}
  },
  "duracionConsulta": 30,
  "licenciaProfesional": "MED123456"
}
```

#### Obtener Todos los Doctores (Admin)

```http
GET /api/doctors
Authorization: Bearer <token_admin>
```

#### Obtener Doctor por ID (Admin)

```http
GET /api/doctors/:id
Authorization: Bearer <token_admin>
```

#### Actualizar Doctor (Admin)

```http
PUT /api/doctors/:id
Authorization: Bearer <token_admin>
```

#### Eliminar Doctor (Admin)

```http
DELETE /api/doctors/:id
Authorization: Bearer <token_admin>
```

---

### 4. CITAS MÉDICAS - `/api/appointments`

#### Agendar Cita (Paciente)

```http
POST /api/appointments/agendar
Authorization: Bearer <token_paciente>
Content-Type: application/json

{
  "doctorId": "607f1f77bcf86cd799439012",
  "fechaCita": "2026-05-15",
  "horaCita": "10:30",
  "motivo": "Consulta de cardiología"
}
```

**Respuesta (201):**
```json
{
  "mensaje": "Cita agendada satisfactoriamente",
  "cita": {
    "_id": "507f1f77bcf86cd799439013",
    "paciente": {...},
    "doctor": {...},
    "fechaCita": "2026-05-15T00:00:00Z",
    "horaCita": "10:30",
    "motivo": "Consulta de cardiología",
    "estado": "programada"
  }
}
```

#### Obtener Mis Citas (Paciente)

```http
GET /api/appointments/mis-citas
Authorization: Bearer <token_paciente>
```

#### Cancelar Cita (Paciente)

```http
PUT /api/appointments/:citaId/cancelar
Authorization: Bearer <token_paciente>
```

#### Reprogramar Cita (Paciente)

```http
PUT /api/appointments/:citaId/reprogramar
Authorization: Bearer <token_paciente>
Content-Type: application/json

{
  "fechaCita": "2026-05-20",
  "horaCita": "14:00"
}
```

#### Obtener Mis Citas (Doctor)

```http
GET /api/appointments/doctor/mis-citas
Authorization: Bearer <token_doctor>
```

#### Completar Cita (Doctor)

```http
PUT /api/appointments/:citaId/completar
Authorization: Bearer <token_doctor>
Content-Type: application/json

{
  "diagnostico": "Presión arterial elevada",
  "tratamiento": "Medicación y ejercicio diario",
  "notas": "Seguimiento en 1 mes"
}
```

#### Crear Cita (Admin)

```http
POST /api/appointments
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "pacienteId": "607f1f77bcf86cd799439014",
  "doctorId": "607f1f77bcf86cd799439012",
  "fechaCita": "2026-05-15",
  "horaCita": "10:30",
  "motivo": "Consulta"
}
```

#### Obtener Todas las Citas (Admin)

```http
GET /api/appointments
Authorization: Bearer <token_admin>
```

#### Obtener Cita por ID (Admin)

```http
GET /api/appointments/:id
Authorization: Bearer <token_admin>
```

#### Actualizar Cita (Admin)

```http
PUT /api/appointments/:id
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "estado": "completada",
  "diagnostico": "Diagnóstico",
  "tratamiento": "Tratamiento"
}
```

#### Eliminar Cita (Admin)

```http
DELETE /api/appointments/:id
Authorization: Bearer <token_admin>
```

---

### 5. ADMINISTRACIÓN - `/api/admin`

#### Cambiar Rol de Usuario

```http
PUT /api/admin/usuarios/:usuarioId/rol
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "nuevoRol": "doctor"
}
```

**Valores válidos:** `paciente`, `doctor`, `admin`

#### Obtener Todos los Usuarios

```http
GET /api/admin/usuarios
Authorization: Bearer <token_admin>
```

#### Cambiar Estado de Usuario (Activar/Desactivar)

```http
PUT /api/admin/usuarios/:usuarioId/estado
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "activo": false
}
```

#### Obtener Estadísticas del Sistema

```http
GET /api/admin/estadisticas
Authorization: Bearer <token_admin>
```

**Respuesta (200):**
```json
{
  "mensaje": "Estadísticas del sistema",
  "estadisticas": {
    "totalUsuarios": 50,
    "totalPacientes": 30,
    "totalDoctores": 15,
    "totalCitas": 120,
    "citasProgramadas": 80,
    "citasCompletadas": 35,
    "citasCanceladas": 5
  }
}
```

---

## Ejemplos de Workflows

### Workflow: Crear Paciente y Agendar Cita

**1. Admin crea usuario**
```bash
POST /api/auth/registro
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "secure123"
}
# Respuesta incluye: token, id
```

**2. Admin cambia rol a paciente**
```bash
PUT /api/admin/usuarios/{usuarioId}/rol
Authorization: Bearer {token_admin}
{
  "nuevoRol": "paciente"
}
```

**3. Admin crea perfil de paciente**
```bash
POST /api/patients
Authorization: Bearer {token_admin}
{
  "usuarioId": "{usuarioId}",
  "numeroIdentificacion": "1234567890",
  "tipoIdentificacion": "CC",
  "telefono": "3001234567",
  "direccion": "Calle 1 #1",
  "ciudad": "Bogotá",
  "fechaNacimiento": "1990-01-15T00:00:00Z",
  "genero": "M"
}
```

**4. Paciente agenda cita**
```bash
POST /api/appointments/agendar
Authorization: Bearer {token_paciente}
{
  "doctorId": "{doctorId}",
  "fechaCita": "2026-05-15",
  "horaCita": "10:30",
  "motivo": "Consulta"
}
```

**5. Doctor completa cita**
```bash
PUT /api/appointments/{citaId}/completar
Authorization: Bearer {token_doctor}
{
  "diagnostico": "Diagnóstico aquí",
  "tratamiento": "Tratamiento aquí",
  "notas": "Observaciones"
}
```

---

## Seguridad

### Implementado

- Contraseñas encriptadas con bcryptjs (10 rondas salt)
- Tokens JWT con expiración de 7 días
- Control de acceso basado en roles (RBAC)
- Validación de entrada en todos los endpoints
- MongoDB con HTTPS (Atlas)
- Campos sensibles nunca se retornan (password)

### Para Producción

- Cambiar `JWT_SECRET` a valor aleatorio seguro
- Usar HTTPS en todas las conexiones
- Implementar rate limiting
- Validar CORS según necesidades
- Usar variables de entorno seguro
- Implementar audit logs

---

## Modelos de Datos

### User

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  nombre: String,
  rol: ['paciente' | 'doctor' | 'admin'],
  activo: Boolean,
  createdAt: Date
}
```

### Patient

```javascript
{
  _id: ObjectId,
  usuario: ObjectId (ref: User),
  numeroIdentificacion: String,
  tipoIdentificacion: ['CC' | 'CE' | 'PA' | 'TI'],
  telefono: String,
  direccion: String,
  ciudad: String,
  fechaNacimiento: Date,
  genero: ['M' | 'F' | 'Otro'],
  historiaMedica: String,
  alergias: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Doctor

```javascript
{
  _id: ObjectId,
  usuario: ObjectId (ref: User),
  numeroIdentificacion: String,
  especialidad: String,
  numeroConsultorio: String,
  telefonoConsultorio: String,
  horarioAtencion: {
    lunes: {inicio: String, fin: String},
    martes: {...},
    ...
  },
  duracionConsulta: Number (default: 30),
  licenciaProfesional: String,
  disponible: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment

```javascript
{
  _id: ObjectId,
  paciente: ObjectId (ref: Patient),
  doctor: ObjectId (ref: Doctor),
  fechaCita: Date,
  horaCita: String,
  motivo: String,
  estado: ['programada' | 'completada' | 'cancelada' | 'reprogramada'],
  notas: String,
  diagnostico: String,
  tratamiento: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 201 | Creado exitosamente |
| 200 | OK |
| 400 | Solicitud inválida |
| 401 | No autenticado |
| 403 | Acceso denegado |
| 404 | Recurso no encontrado |
| 500 | Error del servidor |

---

## Soporte

Para preguntas o issues, contacta al equipo de desarrollo.
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
├── models/
│   └── User.js           # Modelo de usuario
├── routes/
│   └── auth.js           # Rutas de autenticación
└── middleware/
    └── auth.js           # Middleware de verificación JWT
```