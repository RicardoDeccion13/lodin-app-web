const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor Node.js con MySQL funcionando ✅');
});

app.use(express.static(path.join(__dirname, '../src')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/lgn.html'));
});

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invt', require('./routes/invt'));
app.use('/api/ctz', require('./routes/ctz'));


app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});

