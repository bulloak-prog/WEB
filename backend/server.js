// backend/server.js

// Importar módulos necesarios
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const db = require('./database');

// Configurar dotenv para manejar variables de entorno
dotenv.config();

// Crear una instancia de Express
const app = express();

// Obtener el puerto desde las variables de entorno o usar el 3000 por defecto
const PORT = process.env.PORT || 3000;

// Middleware para manejar JSON y habilitar CORS
app.use(express.json());
app.use(cors());

// Ruta para agregar una entrada
app.post('/add-entry', (req, res) => {
    const { date, content } = req.body;

    // Validar los campos requeridos
    if (!date || !content) {
        return res.status(400).json({ message: 'Faltan campos requeridos: date, content' });
    }

    // Insertar la entrada en la base de datos
    const stmt = db.prepare("INSERT INTO entries (date, content) VALUES (?, ?)");
    stmt.run(date, content, function(err) {
        if (err) {
            console.error('Error al insertar la entrada:', err.message);
            return res.status(500).json({ message: 'Error al insertar la entrada' });
        }
        res.status(201).json({ message: 'Entrada agregada exitosamente', entryId: this.lastID });
    });
    stmt.finalize();
});

// Ruta para obtener las entradas de un día específico
app.get('/entries/:date', (req, res) => {
    const { date } = req.params;

    db.all("SELECT * FROM entries WHERE date = ?", [date], (err, rows) => {
        if (err) {
            console.error('Error al obtener las entradas:', err.message);
            return res.status(500).json({ message: 'Error al obtener las entradas' });
        }
        res.status(200).json({ entries: rows });
    });
});

// Configuración del transporte SMTP usando Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Correo electrónico desde variables de entorno
        pass: process.env.EMAIL_PASS, // Contraseña o App Password desde variables de entorno
    },
});

// Verificar la conexión con el servidor SMTP
transporter.verify((error, success) => {
    if (error) {
        console.error('Error con el servidor SMTP:', error);
    } else {
        console.log('Servidor de correo listo para recibir mensajes');
    }
});

// Función para enviar el correo diario
function sendDailyEmail() {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    const dateString = `${year}-${month}-${day}`;

    // Obtener las entradas del día de la base de datos
    db.all("SELECT * FROM entries WHERE date = ?", [dateString], (err, rows) => {
        if (err) {
            console.error('Error al obtener las entradas para el correo diario:', err.message);
            return;
        }

        if (rows.length === 0) {
            console.log('No hay entradas para el día de hoy. No se enviará correo.');
            return;
        }

        // Crear el contenido del correo
        let emailContent = `Resumen de las entradas para el ${today.toLocaleDateString('es-ES')}:\n\n`;
        rows.forEach(entry => {
            emailContent += `- ${entry.content}\n`;
        });

        // Configuración del correo
        const mailOptions = {
            from: process.env.EMAIL_USER, // Remitente
            to: process.env.RECIPIENT_EMAIL, // Destinatario fijo
            subject: `Resumen de Entradas - ${today.toLocaleDateString('es-ES')}`,
            text: emailContent,
        };

        // Enviar el correo
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo diario:', error);
            } else {
                console.log('Correo diario enviado:', info.response);
            }
        });
    });
}

// Programar la tarea diaria para enviar el correo a las 8:00 AM cada día
cron.schedule('0 8 * * *', () => {
    console.log('Ejecutando tarea cron para enviar el correo diario...');
    sendDailyEmail();
}, {
    timezone: "America/Argentina/Buenos_Aires" // Ajusta la zona horaria según tu ubicación
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
