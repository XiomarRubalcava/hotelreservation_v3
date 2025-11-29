// File: config/db.config.js
const mysql = require('mysql2/promise');

// Configuration using environment variables for security
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'hotel_reservations_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Create a connection pool
const dbPool = mysql.createPool(dbConfig);

// Test the connection on startup
dbPool.getConnection()
    .then((connection) => {
        console.log('Successfully connected to the MySQL database.');
        connection.release();
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
        // Exit the process if the connection fails
        process.exit(1);
    });

module.exports = dbPool;
