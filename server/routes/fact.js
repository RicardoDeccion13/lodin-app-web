const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/list_fct', (req, res) => {
    console.log("Entre al listado");
      const sql = ` SELECT FC.id_factura, 
      CL.nombre_cliente, 
      CT.subtotal, 
      CT.iva, 
      CT.total, 
      VT.id_cotizacion,
      DATE_FORMAT(FC.fecha_emision, '%Y-%m-%d') as fecha_emision
      FROM FACTURA FC 
      INNER JOIN VENTAS VT ON FC.id_venta = VT.ID_VENTA 
      INNER JOIN COTIZACION CT ON VT.id_cotizacion = CT.id_cotizacion 
      INNER JOIN CLIENTE CL ON CT.id_cliente = CL.id_cliente; `;

      const params = [];
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            res.json({ results });
        } else {
            res.status(401).json({ error: 'No se encontraron facturas' });
        }
    });

});

router.get('/cb_vta_fct', (req,res) => {
    const sql =  `SELECT * FROM VENTAS WHERE ESTADO_VENTA = 'ENTREGADA';`;

    const params = [];
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            res.json({ results });
        } else {
            res.status(401).json({ error: 'No se encontraron ventas' });
        }
    });
});


router.post('/insert_fct', (req, res) => {
    const { id_venta, fecha_emision } = req.body;

    // Primero verificamos si la venta ya existe en la tabla FACTURA
    const checkSql = `SELECT id_factura FROM FACTURA WHERE id_venta = ?`;
    
    db.query(checkSql, [id_venta], (err, result) => {
        if (err) {
            console.error('Error al verificar la venta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        // Si existe al menos un registro, la venta ya está facturada
        if (result.length > 0) {
            return res.status(400).json({ 
                error: 'Esta venta ya esta facturada, validarla en el listado' 
            });
        }

        // Si no existe, procedemos con la inserción
        const insertSql = `INSERT INTO FACTURA (fecha_emision, id_venta) VALUES (?, ?)`;
        const params = [fecha_emision, id_venta];

        db.query(insertSql, params, (err, result) => {
            if (err) {
                console.error('Error al insertar la factura:', err);
                return res.status(500).json({ error: 'Error al insertar en la base de datos' });
            }

            res.json({ 
                message: 'Factura creada correctamente',
                id_factura: result.insertId // Retornamos el ID autoincremental generado
            });
        });
    });
});

module.exports = router;