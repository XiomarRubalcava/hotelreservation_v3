// File: routes/user.routes.js

const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// User registration endpoint
// POST /api/v1/users/register
router.post('/register', userController.registerUser);

// User login endpoint
// POST /api/v1/users/login
router.post('/login', userController.loginUser);

module.exports = router;
