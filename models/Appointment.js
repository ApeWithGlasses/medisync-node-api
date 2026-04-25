const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  fechaCita: {
    type: Date,
    required: true,
  },
  horaCita: {
    type: String,
    required: true,
  },
  motivo: {
    type: String,
    required: true,
  },
  estado: {
    type: String,
    enum: ['programada', 'completada', 'cancelada', 'reprogramada'],
    default: 'programada',
  },
  notas: {
    type: String,
    default: '',
  },
  diagnostico: {
    type: String,
    default: '',
  },
  tratamiento: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
