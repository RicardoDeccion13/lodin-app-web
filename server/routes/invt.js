const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/inv', (req, res) => {
    const { producto } = req.body;
    console.log('solicitud entregada',producto);

    const prod = (producto || '').toString().trim();
    let sql = 'SELECT * FROM PRODUCTO';
    const params = [];

    if (prod.length > 0) {
        // búsqueda por modelo (LIKE con comodines)
        sql += ' WHERE modelo_producto LIKE ?';
        params.push(`%${prod}%`);
    }    

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            res.json({ results });
        } else {
            res.status(401).json({ error: 'No se encontraron similitudes' });
        }
    });
});

module.exports = router;