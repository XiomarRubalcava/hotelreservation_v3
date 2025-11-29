// File: routes/reservation.routes.js

const express = require('express');
const reservationController = require('../controllers/reservation.controller');
// const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Create a new reservation
// Example: POST /api/v1/reservations
router.post('/', /* authMiddleware, */ reservationController.createReservation);

// Get all reservations for a specific user
// Example: GET /api/v1/reservations/:user_id
router.get('/:user_id', /* authMiddleware, */ reservationController.getUserReservations);

module.exports = router;
