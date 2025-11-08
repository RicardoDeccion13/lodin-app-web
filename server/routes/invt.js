const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/inv', (req, res) => {
    const { producto } = req.body;
    console.log('solicitud entregada',producto);

    const prod = (producto || '').toString().trim();
    let sql = `SELECT 
        id_producto,
        modelo_producto,
        numero_serie,
        precio_producto,
        DATE_FORMAT(Fecha_compra, '%Y-%m-%d') as Fecha_compra,
        descripcion,
        piezas_disponibles,
        id_temporada
        FROM PRODUCTO WHERE live = 1`;
    const params = [];

    if (prod.length > 0) {
        // búsqueda por modelo (LIKE con comodines)
        sql += ' AND modelo_producto LIKE ?';
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

router.post('/save_prod', (req, res) => {
    const {
        modelo_producto,
        descripcion_producto,
        numero_serie_producto,
        precio_producto,
        fecha_compra_producto,
        piezas_disponible_producto,
        operacion
    } = req.body;

    console.log('Datos recibidos para guardar:', req.body);
    if (operacion == '1') {
        // Agregar nuevo producto
        const sqlInsert = `INSERT INTO PRODUCTO 
            (modelo_producto, descripcion, numero_serie, precio_producto, Fecha_compra, piezas_disponibles) 
            VALUES (?, ?, ?, ?, ?, ?)`;
        const paramsInsert = [
            modelo_producto,
            descripcion_producto,
            numero_serie_producto,
            precio_producto,
            fecha_compra_producto,
            piezas_disponible_producto
        ];

        db.query(sqlInsert, paramsInsert, (err, result) => {
            if (err) {
                console.error('Error al insertar producto:', err);
                return res.status(500).json({ error: 'Error en la base de datos' });       
            }
            res.json({ message: 'Producto agregado exitosamente', insertId: result.insertId });
        });
    } else if (operacion == '2') {
        // Editar producto existente
        const sqlUpdate = `UPDATE PRODUCTO SET 
            modelo_producto = ?, 
            descripcion = ?, 
            numero_serie = ?, 
            precio_producto = ?, 
            Fecha_compra = ?, 
            piezas_disponibles = ? 
            WHERE id_producto = ?`;
        const paramsUpdate = [
            modelo_producto,
            descripcion_producto,
            numero_serie_producto,
            precio_producto,
            fecha_compra_producto,
            piezas_disponible_producto,
            id_producto
        ];

        db.query(sqlUpdate, paramsUpdate, (err, result) => {
            if (err) {
                console.error('Error al actualizar producto:', err);
                return res.status(500).json({ error: 'Error en la base de datos' });       
            }
            res.json({ message: 'Producto actualizado exitosamente' });
        });
    } else {
        res.status(400).json({ error: 'Operación no válida' });
    }
});

router.post('/delete_prod', (req, res) => {
    const { id_producto } = req.body;

    const sqlDelete = `UPDATE PRODUCTO SET live = 0 WHERE id_producto = ?`;
    const paramsDelete = [id_producto];

    db.query(sqlDelete, paramsDelete, (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });       
        }
        res.json({ message: 'Producto eliminado exitosamente' });
    });
});

router.post('/cb_tmp', (req, res) => {
    const sql_ = `SELECT id_temporada, nombre_temporada FROM TEMPORADA_PRECIOS;`;
    const params_ = [];
    db.query(sql_, params_, (err, results) => {
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