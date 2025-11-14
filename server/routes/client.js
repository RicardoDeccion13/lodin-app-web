const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/list_cli', (req, res) => {
    const sql = `SELECT 
        id_cliente,
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente
        FROM CLIENTE
        WHERE live = 1;`;

    const params = [];
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            res.json({ results });
        } else {
            res.status(401).json({ error: 'No se encontraron clientes' });
        }
    });
});

router.post('/add_cli', (req, res) => {
    const {
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente
    } = req.body;

    const sql = `INSERT INTO CLIENTE 
        (nombre_cliente, direccion_cliente, telefono_cliente, razon_social, rfc_cliente) 
        VALUES (?, ?, ?, ?, ?);`;

    const params = [
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al insertar cliente:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Cliente agregado exitosamente', id_cliente: result.insertId });
    }); 
});

router.post('/update_cli/:id_cliente', (req, res) => {
    const { id_cliente } = req.params;
    const {
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente
    } = req.body;

    const sql = `UPDATE CLIENTE SET 
        nombre_cliente = ?, 
        direccion_cliente = ?, 
        telefono_cliente = ?, 
        razon_social = ?, 
        rfc_cliente = ? 
        WHERE id_cliente = ?;`;

    const params = [
        nombre_cliente,
        direccion_cliente,
        telefono_cliente,
        razon_social,
        rfc_cliente,
        id_cliente
    ];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar cliente:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Cliente actualizado exitosamente' });
    });
});

router.post('/delete_cli/:id_cliente', (req, res) => {
    const { id_cliente } = req.params;

    const sql = `UPDATE CLIENTE SET 
        live = 0
        WHERE id_cliente = ?;`;
        
    const params = [id_cliente];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al eliminar cliente:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Cliente eliminado exitosamente' });
    });
});

module.exports = router;