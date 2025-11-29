// File: server.js
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const reservationRoutes = require('./routes/reservation.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(helmet());

// CORS — allow frontend (Live Server)
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === API Routes ===
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/reservations', reservationRoutes);

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Hotel Reservation API.' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Access at http://localhost:${PORT}`);
});

// After routes are set, connect to DB to verify connection
const dbPool = require('./config/db.config');

dbPool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database.');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });
