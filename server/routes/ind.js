const express = require('express');
const router = express.Router();
const db = require('../database');


router.get('/metricas', (req, res) => {
    const sql = `   SELECT 
        -- Métricas principales
        (
            SELECT COALESCE(SUM(CT.total), 0)
            FROM VENTAS VT 
            INNER JOIN COTIZACION CT ON VT.ID_COTIZACION = CT.id_cotizacion 
            WHERE YEAR(VT.FECHA_VENTA) = YEAR(CURDATE()) 
            AND MONTH(VT.FECHA_VENTA) = MONTH(CURDATE()) 
            AND VT.ESTADO_VENTA = 'ENTREGADA'
        ) as total_ventas,
        
        (
            SELECT COUNT(*) 
            FROM COTIZACION 
            WHERE estado = 'Pendiente' 
            AND YEAR(fecha_creacion) = YEAR(CURDATE()) 
            AND MONTH(fecha_creacion) = MONTH(CURDATE())
        ) as cotizaciones_pendientes,
        
        (
            SELECT COUNT(*) 
            FROM VENTAS 
            WHERE ESTADO_VENTA = 'ENTREGADA'
            AND YEAR(FECHA_VENTA) = YEAR(CURDATE()) 
            AND MONTH(FECHA_VENTA) = MONTH(CURDATE())
        ) as ventas_entregadas,
        
        (
            SELECT COUNT(*) 
            FROM VENTAS 
            WHERE (ESTADO_VENTA = 'EN CAMINO' OR ESTADO_VENTA = 'PREPARANDO')
            AND YEAR(FECHA_VENTA) = YEAR(CURDATE()) 
            AND MONTH(FECHA_VENTA) = MONTH(CURDATE())
        ) as ventas_proceso,
        
        -- Top clientes (JSON)
        (
            SELECT CONCAT( 
                '[', 
                COALESCE( 
                    GROUP_CONCAT( 
                        CONCAT( 
                            '{"nombre_cliente":"', nombre_cliente, 
                            '","total_ventas":', total_ventas, 
                            '}' 
                        ) 
                    ), 
                    '' 
                ), 
                ']' 
            )
            FROM ( 
                SELECT 
                    C.nombre_cliente as nombre_cliente, 
                    SUM(CT.total) as total_ventas 
                FROM COTIZACION CT 
                INNER JOIN CLIENTE C ON CT.id_cliente = C.id_cliente 
                INNER JOIN VENTAS V ON CT.id_cotizacion = V.id_cotizacion 
                WHERE V.ESTADO_VENTA = 'ENTREGADA' 
                AND YEAR(V.FECHA_VENTA) = YEAR(CURDATE()) 
                AND MONTH(V.FECHA_VENTA) = MONTH(CURDATE()) 
                GROUP BY C.nombre_cliente 
                ORDER BY total_ventas DESC 
                LIMIT 3 
            ) AS top_clientes
        ) as top_clientes_json,
        
        -- Top vendedores (JSON)
        (
            SELECT CONCAT( 
                '[', 
                COALESCE( 
                    GROUP_CONCAT( 
                        CONCAT( 
                            '{"nombre_usuario":"', nombre_usuario, 
                            '","total_ventas":', total_ventas, 
                            '}' 
                        ) 
                    ), 
                    '' 
                ), 
                ']' 
            )
            FROM ( 
                SELECT 
                    CONCAT(C.nombre, ' ', C.apellido_paterno) as nombre_usuario, 
                    SUM(CT.total) as total_ventas 
                FROM COTIZACION CT 
                INNER JOIN USUARIO C ON CT.id_usuario = C.id_usuario 
                INNER JOIN VENTAS V ON CT.id_cotizacion = V.id_cotizacion 
                WHERE V.ESTADO_VENTA = 'ENTREGADA' 
                AND YEAR(V.FECHA_VENTA) = YEAR(CURDATE()) 
                AND MONTH(V.FECHA_VENTA) = MONTH(CURDATE()) 
                GROUP BY nombre_usuario 
                ORDER BY total_ventas DESC 
                LIMIT 3 
            ) AS top_vendedores
        ) as top_vendedores_json;
`;

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

module.exports = router;