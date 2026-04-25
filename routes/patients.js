const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const Patient = require('../models/Patient');
const User = require('../models/User');

const router = express.Router();

// ==================== RUTAS SOLO PARA PACIENTES ====================

// Obtener perfil del paciente autenticado
router.get('/mi-perfil', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const paciente = await Patient.findOne({ usuario: req.userId }).populate('usuario', 'email nombre');
    
    if (!paciente) {
      return res.status(404).json({ error: 'Perfil de paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil del paciente obtenido',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil', detalles: error.message });
  }
});

// Completar información de perfil (Paciente)
router.post('/completar-perfil', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const { numeroIdentificacion, tipoIdentificacion, telefono, direccion, ciudad, fechaNacimiento, genero, historiaMedica, alergias } = req.body;

    // Validar campos
    if (!numeroIdentificacion || !telefono || !direccion || !ciudad || !fechaNacimiento || !genero) {
      return res.status(400).json({
        error: 'Por favor proporcione: numeroIdentificacion, telefono, direccion, ciudad, fechaNacimiento y genero',
      });
    }

    const paciente = await Patient.findOneAndUpdate(
      { usuario: req.userId },
      {
        numeroIdentificacion,
        tipoIdentificacion: tipoIdentificacion || 'CC',
        telefono,
        direccion,
        ciudad,
        fechaNacimiento,
        genero,
        historiaMedica: historiaMedica || '',
        alergias: alergias || '',
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('usuario', 'email nombre');

    if (!paciente) {
      return res.status(404).json({ error: 'Perfil de paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil completado satisfactoriamente',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al completar perfil', detalles: error.message });
  }
});

// Actualizar perfil del paciente
router.put('/mi-perfil', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const { telefono, direccion, ciudad, historiaMedica, alergias } = req.body;

    const paciente = await Patient.findOneAndUpdate(
      { usuario: req.userId },
      {
        telefono,
        direccion,
        ciudad,
        historiaMedica,
        alergias,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil actualizado satisfactoriamente',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil', detalles: error.message });
  }
});

// ==================== RUTAS PARA ADMINISTRADORES ====================

// Crear paciente (Admin)
router.post('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { usuarioId, numeroIdentificacion, tipoIdentificacion, telefono, direccion, ciudad, fechaNacimiento, genero, historiaMedica, alergias } = req.body;

    // Validar que el usuario exista y sea paciente
    const usuario = await User.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si ya existe un paciente con este usuario
    const pacienteExistente = await Patient.findOne({ usuario: usuarioId });
    if (pacienteExistente) {
      return res.status(400).json({ error: 'Ya existe un perfil de paciente para este usuario' });
    }

    const nuevoPaciente = new Patient({
      usuario: usuarioId,
      numeroIdentificacion,
      tipoIdentificacion,
      telefono,
      direccion,
      ciudad,
      fechaNacimiento,
      genero,
      historiaMedica,
      alergias,
    });

    await nuevoPaciente.save();

    res.status(201).json({
      mensaje: 'Paciente creado satisfactoriamente',
      paciente: nuevoPaciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear paciente', detalles: error.message });
  }
});

// Obtener todos los pacientes (Admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const pacientes = await Patient.find().populate('usuario', 'email nombre');

    res.status(200).json({
      mensaje: 'Pacientes obtenidos',
      total: pacientes.length,
      pacientes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pacientes', detalles: error.message });
  }
});

// Obtener paciente por ID (Admin)
router.get('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const paciente = await Patient.findById(req.params.id).populate('usuario', 'email nombre');

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Paciente obtenido',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener paciente', detalles: error.message });
  }
});

// Actualizar paciente (Admin)
router.put('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { numeroIdentificacion, tipoIdentificacion, telefono, direccion, ciudad, fechaNacimiento, genero, historiaMedica, alergias } = req.body;

    const paciente = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        numeroIdentificacion,
        tipoIdentificacion,
        telefono,
        direccion,
        ciudad,
        fechaNacimiento,
        genero,
        historiaMedica,
        alergias,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Paciente actualizado satisfactoriamente',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar paciente', detalles: error.message });
  }
});

// Eliminar paciente (Admin)
router.delete('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const paciente = await Patient.findByIdAndDelete(req.params.id);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Paciente eliminado satisfactoriamente',
      paciente,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar paciente', detalles: error.message });
  }
});

module.exports = router;
