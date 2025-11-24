const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/list_vta', (req, res) => {
    const sql = `SELECT 
        id_venta,
        nombre_cliente,
        total,
        DATE_FORMAT(fecha_venta, '%d-%m-%Y %H:%i') as fecha_venta,
        DATE_FORMAT(FECHA_ENTREGA, '%Y-%m-%dT%H:%i') as fecha_entrega,
        estado_venta,
        observaciones
        FROM VENTAS
        INNER JOIN CLIENTE ON VENTAS.id_cliente = CLIENTE.id_cliente
        INNER JOIN COTIZACION ON VENTAS.id_cotizacion = COTIZACION.id_cotizacion;`;

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

router.post('/update_vta', (req, res) => {
    const { id_venta, fecha_entrega, estado_venta, observaciones } = req.body;

    const sql = `UPDATE VENTAS 
                 SET fecha_entrega = ?, estado_venta = ?, observaciones = ?
                     WHERE id_venta = ?;`;
    const params = [fecha_entrega, estado_venta, observaciones, id_venta];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al actualizar la venta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Venta actualizada correctamente' });
    });
});

router.post('/detalle_vta', (req, res) => {
    const { id_venta } = req.body;
    const sql = `SELECT 
    CLIENTE.nombre_cliente, 
    COTIZACION.id_cotizacion, 
    estado_venta, 
    DATE_FORMAT(FECHA_VENTA, '%Y-%m-%dT%H:%i') as fecha_venta, 
    DATE_FORMAT(FECHA_ENTREGA, '%Y-%m-%dT%H:%i') as fecha_entrega, 
    observaciones 
    FROM VENTAS 
    INNER JOIN CLIENTE ON VENTAS.id_cliente = CLIENTE.id_cliente 
    INNER JOIN COTIZACION ON VENTAS.id_cotizacion = COTIZACION.id_cotizacion 
    WHERE id_venta = ?;`;

    const params = [id_venta];
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            res.json({ results });
        } else {
            res.status(401).json({ error: 'No se encontraron detalles para la venta' });
        }
    });
});

router.post('/det_ct', (req,res) =>{
    const { id_cotizacion_vt } = req.body;
    
    const sql = `
        SELECT cd.id_producto, cd.cantidad, p.precio_producto as precio_unitario, p.modelo_producto
        FROM COTIZACION_DETALLE cd
        INNER JOIN PRODUCTO p ON cd.id_producto = p.id_producto
        WHERE cd.id_cotizacion = ?
    `;

    db.query(sql, [id_cotizacion_vt], (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ results });
    });
});

module.exports = router;