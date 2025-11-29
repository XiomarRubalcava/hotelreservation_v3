// File: controllers/user.controller.js

const dbPool = require('../config/db.config');

/**
 * Register a new user.
 * Accepts first_name, last_name, email, password and phone_number from the request body.
 * Inserts a new row into the users table and returns the new user ID on success.
 */
exports.registerUser = async (req, res) => {
    const { first_name, last_name, email, password, phone_number } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields (first_name, last_name, email, password).' });
    }
    const passwordHash = password; // In a real application, hash the password before storing
    try {
        const sql = 'INSERT INTO users (first_name, last_name, email, password_hash, phone_number) VALUES (?, ?, ?, ?, ?)';
        const params = [first_name, last_name, email, passwordHash, phone_number || null];
        const [result] = await dbPool.execute(sql, params);
        return res.status(201).json({ message: 'User registered successfully.', userId: result.insertId });
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already registered. Please use a different email.' });
        }
        return res.status(500).json({ message: 'Failed to register user.', error: error.message });
    }
};

/**
 * Login an existing user.
 * Accepts email and password from the request body and returns the user ID if credentials match.
 */
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password.' });
    }
    try {
        const sql = 'SELECT user_id, password_hash FROM users WHERE email = ?';
        const [rows] = await dbPool.execute(sql, [email]);
        if (!rows || rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const user = rows[0];
        // Compare provided password to stored password_hash (no hashing in this simple example)
        if (user.password_hash !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        return res.status(200).json({ message: 'Login successful.', userId: user.user_id });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Failed to login.', error: error.message });
    }
};
