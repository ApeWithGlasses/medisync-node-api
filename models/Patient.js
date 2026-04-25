const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  numeroIdentificacion: {
    type: String,
    default: '',
  },
  tipoIdentificacion: {
    type: String,
    enum: ['CC', 'CE', 'PA', 'TI'],
    default: 'CC',
  },
  telefono: {
    type: String,
    default: '',
  },
  direccion: {
    type: String,
    default: '',
  },
  ciudad: {
    type: String,
    default: '',
  },
  fechaNacimiento: {
    type: Date,
    default: null,
  },
  genero: {
    type: String,
    enum: ['M', 'F', 'Otro'],
    default: 'M',
  },
  historiaMedica: {
    type: String,
    default: '',
  },
  alergias: {
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

module.exports = mongoose.model('Patient', patientSchema);
