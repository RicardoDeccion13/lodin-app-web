const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/cotiz', (req, res) => {
    console.log('Ver cotizaciones');

    let sql = `SELECT ct.id_cotizacion, 
    DATE_FORMAT(ct.fecha_creacion, '%Y-%m-%d') as fecha_creacion, 
    cl.nombre_cliente, 
    CONCAT(usr.nombre,' ',usr.apellido_paterno) as nombre_usuario, 
    ct.subtotal, 
    ct.iva, 
    ct.total,
    ct.estado
    FROM COTIZACION ct 
    INNER JOIN CLIENTE cl ON (ct.id_cliente = cl.id_cliente) 
    INNER JOIN USUARIO usr ON (ct.id_usuario = usr.id_usuario);`;

    const params = [];

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

router.get('/cb_cli', (req, res) => {
    let sql = `SELECT * FROM CLIENTE;`;

    const params = [];

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

router.get('/cb_usr', (req, res) => {
    let sql = `SELECT id_usuario, CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno) as 'nombre_usuario' FROM USUARIO;`;

    const params = [];

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
