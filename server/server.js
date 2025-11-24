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

app.use('/api',cors({
  origin: true, // Permite cualquier origen
  credentials: true
}));

// Rutas API
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/invt',  require('./routes/invt'));
app.use('/api/ctz',   require('./routes/ctz'));
app.use('/api/client', require('./routes/client'));
app.use('/api/vta',   require('./routes/vta'));
app.use('/api/fact',  require('./routes/fact'));
app.use('/api/ind', require('./routes/ind'));

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});

