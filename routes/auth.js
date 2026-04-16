const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// REGISTRO
router.post('/registro', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!email || !password || !nombre) {
      return res.status(400).json({
        error: 'Por favor proporcione email, contraseña y nombre',
      });
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({
        error: 'El email ya está registrado',
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new User({
      email,
      password,
      nombre,
    });

    await nuevoUsuario.save();

    // Generar token JWT
    const token = jwt.sign(
      { userId: nuevoUsuario._id },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      mensaje: 'Registro satisfactorio',
      usuario: {
        id: nuevoUsuario._id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
      },
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error en el registro',
      detalles: error.message,
    });
  }
});

// INICIO DE SESIÓN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!email || !password) {
      return res.status(400).json({
        error: 'Por favor proporcione email y contraseña',
      });
    }

    // Buscar usuario por email
    const usuario = await User.findOne({ email });
    if (!usuario) {
      return res.status(401).json({
        error: 'Error en la autenticación',
      });
    }

    // Comparar contraseña
    const contraseñaValida = await usuario.comparePassword(password);
    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Error en la autenticación',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: usuario._id },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      mensaje: 'Autenticación satisfactoria',
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
      },
      token,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en la autenticación',
      detalles: error.message,
    });
  }
});

module.exports = router;
