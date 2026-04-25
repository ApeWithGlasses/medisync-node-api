require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const doctorsRoutes = require('./routes/doctors');
const appointmentsRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');

const app = express();
const uri = process.env.URI;
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Bienvenido a MediSync API',
    version: '1.0.0',
    endpoints: {
      autenticacion: '/api/auth',
      pacientes: '/api/patients',
      doctores: '/api/doctors',
      citas: '/api/appointments',
      administracion: '/api/admin',
    },
  });
});

// Conectar a MongoDB
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function conectarMongoDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('✓ Conectado a MongoDB exitosamente');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
  }
}

conectarMongoDB();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});