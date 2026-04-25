const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const verificarRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      if (!rolesPermitidos.includes(usuario.rol)) {
        return res.status(403).json({
          error: 'Acceso denegado. No tienes permisos suficientes',
        });
      }

      req.usuario = usuario;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error en la verificación de rol' });
    }
  };
};

module.exports = { verificarToken, verificarRol };
