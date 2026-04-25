const express = require('express');
const { verificarToken, verificarRol } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const router = express.Router();

// ==================== RUTAS PARA PACIENTES ====================

// Agendar cita médica
router.post('/agendar', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const { doctorId, fechaCita, horaCita, motivo } = req.body;

    // Validar campos
    if (!doctorId || !fechaCita || !horaCita || !motivo) {
      return res.status(400).json({
        error: 'Por favor proporcione doctor, fecha, hora y motivo de la cita',
      });
    }

    // Obtener el perfil del paciente
    const paciente = await Patient.findOne({ usuario: req.userId });
    if (!paciente) {
      return res.status(404).json({ error: 'Debe completar su perfil como paciente primero' });
    }

    // Validar que el doctor existe
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    // Validar que la fecha sea futura
    const fechaSeleccionada = new Date(fechaCita);
    if (fechaSeleccionada < new Date()) {
      return res.status(400).json({ error: 'La fecha debe ser en el futuro' });
    }

    // Verificar disponibilidad de horario (no existe otra cita en el mismo horario)
    const citaExistente = await Appointment.findOne({
      doctor: doctorId,
      fechaCita: fechaSeleccionada,
      horaCita,
      estado: { $in: ['programada', 'reprogramada'] },
    });

    if (citaExistente) {
      return res.status(400).json({
        error: 'El doctor no está disponible en ese horario. Por favor seleccione otro',
      });
    }

    // Crear la cita
    const nuevaCita = new Appointment({
      paciente: paciente._id,
      doctor: doctorId,
      fechaCita: fechaSeleccionada,
      horaCita,
      motivo,
    });

    await nuevaCita.save();

    // Obtener datos completos
    const citaCompleta = await Appointment.findById(nuevaCita._id).populate([
      {
        path: 'paciente',
        populate: { path: 'usuario', select: 'email nombre' },
      },
      {
        path: 'doctor',
        populate: { path: 'usuario', select: 'email nombre' },
      },
    ]);

    res.status(201).json({
      mensaje: 'Cita agendada satisfactoriamente',
      cita: citaCompleta,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al agendar cita', detalles: error.message });
  }
});

// Obtener mis citas
router.get('/mis-citas', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const paciente = await Patient.findOne({ usuario: req.userId });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const citas = await Appointment.find({ paciente: paciente._id })
      .populate('doctor')
      .populate({
        path: 'doctor',
        populate: { path: 'usuario', select: 'email nombre' },
      })
      .sort({ fechaCita: 1 });

    res.status(200).json({
      mensaje: 'Citas obtenidas',
      total: citas.length,
      citas,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas', detalles: error.message });
  }
});

// Cancelar cita
router.put('/:citaId/cancelar', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const paciente = await Patient.findOne({ usuario: req.userId });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Verificar que la cita pertenezca al paciente
    const cita = await Appointment.findById(req.params.citaId);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.paciente.toString() !== paciente._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
    }

    if (cita.estado === 'cancelada') {
      return res.status(400).json({ error: 'La cita ya fue cancelada' });
    }

    // Cancelar cita
    cita.estado = 'cancelada';
    await cita.save();

    res.status(200).json({
      mensaje: 'Cita cancelada satisfactoriamente',
      cita,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar cita', detalles: error.message });
  }
});

// Reprogramar cita
router.put('/:citaId/reprogramar', verificarToken, verificarRol(['paciente']), async (req, res) => {
  try {
    const { fechaCita, horaCita } = req.body;

    if (!fechaCita || !horaCita) {
      return res.status(400).json({
        error: 'Por favor proporcione nueva fecha y hora',
      });
    }

    const paciente = await Patient.findOne({ usuario: req.userId });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Obtener la cita
    const cita = await Appointment.findById(req.params.citaId);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.paciente.toString() !== paciente._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para reprogramar esta cita' });
    }

    if (cita.estado === 'cancelada') {
      return res.status(400).json({ error: 'No puedes reprogramar una cita cancelada' });
    }

    // Validar nueva fecha
    const fechaSeleccionada = new Date(fechaCita);
    if (fechaSeleccionada < new Date()) {
      return res.status(400).json({ error: 'La nueva fecha debe ser en el futuro' });
    }

    // Verificar disponibilidad en nuevo horario
    const citaEnConflicto = await Appointment.findOne({
      doctor: cita.doctor,
      fechaCita: fechaSeleccionada,
      horaCita,
      _id: { $ne: cita._id },
      estado: { $in: ['programada', 'reprogramada'] },
    });

    if (citaEnConflicto) {
      return res.status(400).json({
        error: 'El doctor no está disponible en ese nuevo horario',
      });
    }

    // Actualizar cita
    cita.fechaCita = fechaSeleccionada;
    cita.horaCita = horaCita;
    cita.estado = 'reprogramada';
    cita.updatedAt = Date.now();

    await cita.save();

    const citaActualizada = await cita.populate('doctor').populate({
      path: 'doctor',
      populate: { path: 'usuario', select: 'email nombre' },
    });

    res.status(200).json({
      mensaje: 'Cita reprogramada satisfactoriamente',
      cita: citaActualizada,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al reprogramar cita', detalles: error.message });
  }
});

// ==================== RUTAS PARA DOCTORES ====================

// Obtener mis citas (doctor)
router.get('/doctor/mis-citas', verificarToken, verificarRol(['doctor']), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ usuario: req.userId });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    const citas = await Appointment.find({ doctor: doctor._id })
      .populate('paciente')
      .populate({
        path: 'paciente',
        populate: { path: 'usuario', select: 'email nombre' },
      })
      .sort({ fechaCita: 1 });

    res.status(200).json({
      mensaje: 'Citas obtenidas',
      total: citas.length,
      citas,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas', detalles: error.message });
  }
});

// Registrar diagnóstico y tratamiento (doctor)
router.put('/:citaId/completar', verificarToken, verificarRol(['doctor']), async (req, res) => {
  try {
    const { diagnostico, tratamiento, notas } = req.body;

    const doctor = await Doctor.findOne({ usuario: req.userId });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    const cita = await Appointment.findById(req.params.citaId);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (cita.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta cita' });
    }

    cita.diagnostico = diagnostico || cita.diagnostico;
    cita.tratamiento = tratamiento || cita.tratamiento;
    cita.notas = notas || cita.notas;
    cita.estado = 'completada';
    cita.updatedAt = Date.now();

    await cita.save();

    res.status(200).json({
      mensaje: 'Cita completada satisfactoriamente',
      cita,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al completar cita', detalles: error.message });
  }
});

// ==================== RUTAS PARA ADMINISTRADORES ====================

// Crear cita (Admin)
router.post('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { pacienteId, doctorId, fechaCita, horaCita, motivo } = req.body;

    if (!pacienteId || !doctorId || !fechaCita || !horaCita || !motivo) {
      return res.status(400).json({
        error: 'Por favor proporcione todos los datos requeridos',
      });
    }

    // Validar paciente
    const paciente = await Patient.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    // Validar doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    const fechaSeleccionada = new Date(fechaCita);
    if (fechaSeleccionada < new Date()) {
      return res.status(400).json({ error: 'La fecha debe ser en el futuro' });
    }

    // Verificar disponibilidad
    const citaExistente = await Appointment.findOne({
      doctor: doctorId,
      fechaCita: fechaSeleccionada,
      horaCita,
      estado: { $in: ['programada', 'reprogramada'] },
    });

    if (citaExistente) {
      return res.status(400).json({
        error: 'Ya existe una cita en ese horario',
      });
    }

    const nuevaCita = new Appointment({
      paciente: pacienteId,
      doctor: doctorId,
      fechaCita: fechaSeleccionada,
      horaCita,
      motivo,
    });

    await nuevaCita.save();

    const citaCompleta = await Appointment.findById(nuevaCita._id).populate([
      {
        path: 'paciente',
        populate: { path: 'usuario', select: 'email nombre' },
      },
      {
        path: 'doctor',
        populate: { path: 'usuario', select: 'email nombre' },
      },
    ]);

    res.status(201).json({
      mensaje: 'Cita creada satisfactoriamente',
      cita: citaCompleta,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cita', detalles: error.message });
  }
});

// Obtener todas las citas (Admin)
router.get('/', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const citas = await Appointment.find()
      .populate('paciente')
      .populate('doctor')
      .populate({
        path: 'paciente',
        populate: { path: 'usuario', select: 'email nombre' },
      })
      .populate({
        path: 'doctor',
        populate: { path: 'usuario', select: 'email nombre' },
      })
      .sort({ fechaCita: 1 });

    res.status(200).json({
      mensaje: 'Citas obtenidas',
      total: citas.length,
      citas,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas', detalles: error.message });
  }
});

// Obtener cita por ID (Admin)
router.get('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const cita = await Appointment.findById(req.params.id)
      .populate('paciente')
      .populate('doctor')
      .populate({
        path: 'paciente',
        populate: { path: 'usuario', select: 'email nombre' },
      })
      .populate({
        path: 'doctor',
        populate: { path: 'usuario', select: 'email nombre' },
      });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.status(200).json({
      mensaje: 'Cita obtenida',
      cita,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cita', detalles: error.message });
  }
});

// Actualizar cita (Admin)
router.put('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const { fechaCita, horaCita, motivo, diagnostico, tratamiento, notas, estado } = req.body;

    const cita = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        fechaCita: fechaCita || undefined,
        horaCita: horaCita || undefined,
        motivo: motivo || undefined,
        diagnostico: diagnostico || undefined,
        tratamiento: tratamiento || undefined,
        notas: notas || undefined,
        estado: estado || undefined,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.status(200).json({
      mensaje: 'Cita actualizada satisfactoriamente',
      cita,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cita', detalles: error.message });
  }
});

// Eliminar cita (Admin)
router.delete('/:id', verificarToken, verificarRol(['admin']), async (req, res) => {
  try {
    const cita = await Appointment.findByIdAndDelete(req.params.id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.status(200).json({
      mensaje: 'Cita eliminada satisfactoriamente',
      cita,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cita', detalles: error.message });
  }
});

module.exports = router;
