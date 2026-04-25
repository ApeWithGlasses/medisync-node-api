const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const router = express.Router();

// ==================== RUTAS PARA DOCTORES ====================

// Obtener perfil del doctor autenticado
router.get('/mi-perfil', verificarToken, verificarRol(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ usuario: req.userId }).populate('usuario', 'email nombre');

    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil del doctor obtenido',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil', detalles: error.message });
  }
});

// Completar información de perfil (Doctor)
router.post('/completar-perfil', verificarToken, verificarRol(['doctor']), async (req, res) => {
  try {
    const { numeroIdentificacion, especialidad, numeroConsultorio, telefonoConsultorio, horarioAtencion, duracionConsulta, licenciaProfesional } = req.body;

    // Validar campos
    if (!numeroIdentificacion || !especialidad || !numeroConsultorio || !telefonoConsultorio || !licenciaProfesional) {
      return res.status(400).json({
        error: 'Por favor proporcione: numeroIdentificacion, especialidad, numeroConsultorio, telefonoConsultorio y licenciaProfesional',
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { usuario: req.userId },
      {
        numeroIdentificacion,
        especialidad,
        numeroConsultorio,
        telefonoConsultorio,
        horarioAtencion: horarioAtencion || {
          lunes: { inicio: '', fin: '' },
          martes: { inicio: '', fin: '' },
          miercoles: { inicio: '', fin: '' },
          jueves: { inicio: '', fin: '' },
          viernes: { inicio: '', fin: '' },
          sabado: { inicio: '', fin: '' },
          domingo: { inicio: '', fin: '' },
        },
        duracionConsulta: duracionConsulta || 30,
        licenciaProfesional,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('usuario', 'email nombre');

    if (!doctor) {
      return res.status(404).json({ error: 'Perfil de doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil completado satisfactoriamente',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al completar perfil', detalles: error.message });
  }
});

// Actualizar perfil del doctor
router.put('/mi-perfil', verificarToken, verificarRol(['doctor']), async (req, res) => {
  try {
    const { telefonoConsultorio, horarioAtencion, duracionConsulta, disponible } = req.body;

    const doctor = await Doctor.findOneAndUpdate(
      { usuario: req.userId },
      {
        telefonoConsultorio,
        horarioAtencion,
        duracionConsulta,
        disponible,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Perfil actualizado satisfactoriamente',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil', detalles: error.message });
  }
});

// ==================== RUTAS PARA ADMINISTRADORES ====================

// Crear doctor (Admin)
router.post('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { usuarioId, numeroIdentificacion, especialidad, numeroConsultorio, telefonoConsultorio, horarioAtencion, duracionConsulta, licenciaProfesional } = req.body;

    // Validar que el usuario exista
    const usuario = await User.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si ya existe un doctor con este usuario
    const doctorExistente = await Doctor.findOne({ usuario: usuarioId });
    if (doctorExistente) {
      return res.status(400).json({ error: 'Ya existe un perfil de doctor para este usuario' });
    }

    const nuevoDoctor = new Doctor({
      usuario: usuarioId,
      numeroIdentificacion,
      especialidad,
      numeroConsultorio,
      telefonoConsultorio,
      horarioAtencion,
      duracionConsulta: duracionConsulta || 30,
      licenciaProfesional,
    });

    await nuevoDoctor.save();

    res.status(201).json({
      mensaje: 'Doctor creado satisfactoriamente',
      doctor: nuevoDoctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear doctor', detalles: error.message });
  }
});

// Obtener todos los doctores (Admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('usuario', 'email nombre');

    res.status(200).json({
      mensaje: 'Doctores obtenidos',
      total: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctores', detalles: error.message });
  }
});

// Obtener doctor por ID (Admin)
router.get('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('usuario', 'email nombre');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Doctor obtenido',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener doctor', detalles: error.message });
  }
});

// Actualizar doctor (Admin)
router.put('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { numeroIdentificacion, especialidad, numeroConsultorio, telefonoConsultorio, horarioAtencion, duracionConsulta, licenciaProfesional, disponible } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        numeroIdentificacion,
        especialidad,
        numeroConsultorio,
        telefonoConsultorio,
        horarioAtencion,
        duracionConsulta,
        licenciaProfesional,
        disponible,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Doctor actualizado satisfactoriamente',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar doctor', detalles: error.message });
  }
});

// Eliminar doctor (Admin)
router.delete('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Doctor eliminado satisfactoriamente',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar doctor', detalles: error.message });
  }
});

module.exports = router;
