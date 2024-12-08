const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Importa CORS

const app = express();
const PORT = 3000;

// Middleware para manejar JSON y CORS
app.use(express.json());
app.use(cors()); // Habilita CORS

// Ruta para enviar correos
app.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    try {
        // Configuración del transporte SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Cambia si usas otro proveedor
            auth: {
                user: "enviarmailsbackend@gmail.com", // Cambia por tu email
                pass: 'oarx alhg lvol iyrc', // Cambia por tu contraseña o App Password
            },
        });

        // Configuración del correo
        const mailOptions = {
            from: 'enviarmailsbackend@gmail.com',
            to: to,  // Destinatario
            subject: subject, // Asunto
            text: text, // Contenido
        };

        // Enviar correo
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: ', info.response);

        res.status(200).json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error al enviar correo: ', error);
        res.status(500).json({ message: 'Error al enviar el correo', error });
    }
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
