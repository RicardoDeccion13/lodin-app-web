const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor Node.js con MySQL funcionando ✅');
});


app.post('/login', (req, res) => {
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
      // Usuario encontrado
      res.json({ message: 'Login exitoso', usuario: results[0] });
    } else {
      // No coincide
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});

