// src/database.js
const mysql = require('mysql');

// Crear conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'lodin_bd' 
});



connection.connect((error) => {
    if (error) {
        console.error('❌ Error conectando a la BD:', error);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;