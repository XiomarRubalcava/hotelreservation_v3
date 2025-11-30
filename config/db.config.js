// File: config/db.config.js
const mysql = require('mysql2/promise');

// Configuration using environment variables for security
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    // IMPORTANT: Railway requires SSL for external connections
    ssl: {
        rejectUnauthorized: false
    },

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
        // Exit ONLY if you want to stop deployment on DB failure
        // process.exit(1);
    });

module.exports = dbPool;
