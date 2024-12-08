// backend/database.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear una conexión a la base de datos SQLite
const db = new sqlite3.Database(path.resolve(__dirname, 'entries.db'), (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
    }
});

// Crear la tabla de entradas si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
