const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const sql = 'SELECT * FROM USUARIO WHERE usuario = ? AND contrasenia = ?';
  db.query(sql, [correo, password], (err, results) => {
    if (err) {
      console.error('Error al ejecutar consulta:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (results.length > 0) {
      res.json({ message: 'Login exitoso', usuario: results[0] });
    } else {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
  });
});

module.exports = router;