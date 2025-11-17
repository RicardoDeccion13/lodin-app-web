const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/cotiz', (req, res) => {
    console.log('Ver cotizaciones');

    let sql = `SELECT ct.id_cotizacion, 
    DATE_FORMAT(ct.fecha_creacion, '%Y-%m-%d') as fecha_creacion, 
    cl.nombre_cliente, 
    CONCAT(usr.nombre,' ',usr.apellido_paterno, ' ', usr.apellido_materno) as nombre_usuario, 
    ct.subtotal, 
    ct.iva, 
    ct.total,
    ct.estado
    FROM COTIZACION ct 
    INNER JOIN CLIENTE cl ON (ct.id_cliente = cl.id_cliente) 
    INNER JOIN USUARIO usr ON (ct.id_usuario = usr.id_usuario)
    ORDER BY ct.id_cotizacion DESC;`;

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


router.post('/save_ct', (req, res) => {
    const  { id_cliente, id_usuario, fecha_creacion } = req.body;
    
    let sqlInsert = `INSERT INTO COTIZACION (id_cliente, id_usuario, fecha_creacion, subtotal, iva, total, estado) 
                     VALUES (?, ?, ?, 0, 0, 0, 'Pendiente')`;
    const paramsInsert = [id_cliente, id_usuario, fecha_creacion];
    db.query(sqlInsert, paramsInsert, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Cotización guardada exitosamente', id_cotizacion: results.insertId });
    }); 
});

router.post('/update_ct', (req, res) => {
    const  { id_cotizacion, id_cliente, id_usuario, fecha_creacion, estado } = req.body;
    
    let sqlUpdate = `UPDATE COTIZACION 
                     SET id_cliente = ?, id_usuario = ?, fecha_creacion = ?, estado = ? 
                     WHERE id_cotizacion = ?`;
    const paramsUpdate = [id_cliente, id_usuario, fecha_creacion, estado, id_cotizacion];
    db.query(sqlUpdate, paramsUpdate, (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ message: 'Cotización actualizada exitosamente' });
    }); 
});

router.get('/cb_prod', (req, res) => {
    let sql = `SELECT * FROM PRODUCTO;`;

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

router.post('/save_d_ct', (req, res) => {
    const { id_cotizacion, productos, totales } = req.body;
     // Primero actualizamos los totales en la tabla COTIZACION
    const sqlUpdateTotales = `
        UPDATE COTIZACION 
        SET subtotal = ?, iva = ?, total = ?
        WHERE id_cotizacion = ?
    `;
    
    db.query(sqlUpdateTotales, 
        [totales.subtotal, totales.iva, totales.total, id_cotizacion], 
        (err, resultsUpdate) => {
            if (err) {
                console.error('Error al actualizar totales:', err);
                return res.status(500).json({ error: 'Error al actualizar totales' });
            }

            // Primero eliminamos los detalles existentes
            const sqlDelete = `DELETE FROM COTIZACION_DETALLE WHERE id_cotizacion = ?`;
            
            db.query(sqlDelete, [id_cotizacion], (err, resultsDelete) => {
                if (err) {
                    console.error('Error al eliminar detalles anteriores:', err);
                    return res.status(500).json({ error: 'Error al eliminar detalles anteriores' });
                }

                // Preparamos la consulta para insertar múltiples registros
                const sqlInsert = `
                    INSERT INTO COTIZACION_DETALLE 
                    (id_cotizacion, id_producto, cantidad) 
                    VALUES ?
                `;

                // Preparamos los valores para inserción múltiple
                const values = productos.map(producto => [
                    id_cotizacion,
                    producto.id_producto,
                    producto.cantidad
                ]);

                // Insertamos todos los productos
                db.query(sqlInsert, [values], (err, resultsInsert) => {
                    if (err) {
                        console.error('Error al insertar detalles:', err);
                        return res.status(500).json({ error: 'Error al guardar detalles' });
                    }

                    res.json({ 
                        message: 'Detalles de cotización guardados exitosamente',
                        registrosInsertados: resultsInsert.affectedRows 
                    });
                });
            });
    });
});

router.get('/get_detalle/:id', (req, res) => {
    const id_cotizacion = req.params.id;
    
    const sql = `
        SELECT cd.id_producto, cd.cantidad, p.precio_producto as precio_unitario, p.modelo_producto
        FROM COTIZACION_DETALLE cd
        INNER JOIN PRODUCTO p ON cd.id_producto = p.id_producto
        WHERE cd.id_cotizacion = ?
    `;

    db.query(sql, [id_cotizacion], (err, results) => {
        if (err) {
            console.error('Error al ejecutar consulta:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        res.json({ results });
    });
});

module.exports = router;
