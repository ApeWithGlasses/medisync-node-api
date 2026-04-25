const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const crearAdmin = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medisync');
    console.log('Conectado a MongoDB');

    // Verificar si ya existe un admin
    const adminExistente = await User.findOne({ rol: 'admin' });
    if (adminExistente) {
      console.log('⚠️  Ya existe un admin en el sistema:', adminExistente.email);
      process.exit(0);
    }

    // Crear nuevo admin
    const nuevoAdmin = new User({
      email: 'admin@medisync.com',
      password: 'Admin@123456',
      nombre: 'Administrador',
      rol: 'admin',
      activo: true,
    });

    await nuevoAdmin.save();

    console.log('✅ Admin creado exitosamente');
    console.log('Email:', nuevoAdmin.email);
    console.log('Contraseña: Admin@123456');
    console.log('⚠️  Por favor, cambia la contraseña después del primer inicio de sesión');

    process.exit(0);
  } catch (error) {
    console.error('Error al crear admin:', error);
    process.exit(1);
  }
};

crearAdmin();
