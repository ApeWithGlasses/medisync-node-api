const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const router = express.Router();

// Cambiar rol de usuario (Solo Admin)
router.put('/usuarios/:usuarioId/rol', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { nuevoRol } = req.body;

    if (!['paciente', 'doctor', 'admin'].includes(nuevoRol)) {
      return res.status(400).json({
        error: 'Rol inválido. Debe ser: paciente, doctor o admin',
      });
    }

    const usuario = await User.findByIdAndUpdate(
      req.params.usuarioId,
      { rol: nuevoRol },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Crear perfil automáticamente si es paciente o doctor
    if (nuevoRol === 'paciente') {
      const perfilExistente = await Patient.findOne({ usuario: usuario._id });
      if (!perfilExistente) {
        const nuevoPaciente = new Patient({
          usuario: usuario._id,
          numeroIdentificacion: '',
          tipoIdentificacion: 'CC',
          telefono: '',
          direccion: '',
          ciudad: '',
          fechaNacimiento: null,
          genero: 'M',
          historiaMedica: '',
          alergias: '',
        });
        await nuevoPaciente.save();
      }
    } else if (nuevoRol === 'doctor') {
      const perfilExistente = await Doctor.findOne({ usuario: usuario._id });
      if (!perfilExistente) {
        const nuevoDoctor = new Doctor({
          usuario: usuario._id,
          numeroIdentificacion: '',
          especialidad: '',
          numeroConsultorio: '',
          telefonoConsultorio: '',
          horarioAtencion: {
            lunes: { inicio: '', fin: '' },
            martes: { inicio: '', fin: '' },
            miercoles: { inicio: '', fin: '' },
            jueves: { inicio: '', fin: '' },
            viernes: { inicio: '', fin: '' },
            sabado: { inicio: '', fin: '' },
            domingo: { inicio: '', fin: '' },
          },
          duracionConsulta: 30,
          licenciaProfesional: '',
        });
        await nuevoDoctor.save();
      }
    }

    res.status(200).json({
      mensaje: 'Rol del usuario actualizado satisfactoriamente',
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar rol', detalles: error.message });
  }
});

// Obtener todos los usuarios (Solo Admin)
router.get('/usuarios', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const usuarios = await User.find().select('-password');

    res.status(200).json({
      mensaje: 'Usuarios obtenidos',
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', detalles: error.message });
  }
});

// Cambiar estado de usuario (Solo Admin)
router.put('/usuarios/:usuarioId/estado', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        error: 'El campo activo debe ser verdadero o falso',
      });
    }

    const usuario = await User.findByIdAndUpdate(
      req.params.usuarioId,
      { activo },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Estado del usuario actualizado satisfactoriamente',
      usuario,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado', detalles: error.message });
  }
});

// Obtener estadísticas del sistema (Solo Admin)
router.get('/estadisticas', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const User = require('../models/User');
    const Patient = require('../models/Patient');
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');

    const totalUsuarios = await User.countDocuments();
    const totalPacientes = await Patient.countDocuments();
    const totalDoctores = await Doctor.countDocuments();
    const totalCitas = await Appointment.countDocuments();
    const citasProgramadas = await Appointment.countDocuments({ estado: 'programada' });
    const citasCompletadas = await Appointment.countDocuments({ estado: 'completada' });
    const citasCanceladas = await Appointment.countDocuments({ estado: 'cancelada' });

    res.status(200).json({
      mensaje: 'Estadísticas del sistema',
      estadisticas: {
        totalUsuarios,
        totalPacientes,
        totalDoctores,
        totalCitas,
        citasProgramadas,
        citasCompletadas,
        citasCanceladas,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas', detalles: error.message });
  }
});

module.exports = router;
