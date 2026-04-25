const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
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
  especialidad: {
    type: String,
    default: '',
  },
  numeroConsultorio: {
    type: String,
    default: '',
  },
  telefonoConsultorio: {
    type: String,
    default: '',
  },
  horarioAtencion: {
    lunes: { inicio: String, fin: String },
    martes: { inicio: String, fin: String },
    miercoles: { inicio: String, fin: String },
    jueves: { inicio: String, fin: String },
    viernes: { inicio: String, fin: String },
    sabado: { inicio: String, fin: String },
    domingo: { inicio: String, fin: String },
  },
  duracionConsulta: {
    type: Number,
    default: 30,
  },
  licenciaProfesional: {
    type: String,
    default: '',
  },
  disponible: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model('Doctor', doctorSchema);
