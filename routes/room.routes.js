// File: routes/room.routes.js

const express = require('express');
const roomController = require('../controllers/room.controller');

const router = express.Router();

// Route for checking room availability
// Example: GET /api/v1/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
router.get('/available', roomController.getAvailableRooms);

// Route for fetching a specific room by its ID
// Example: GET /api/v1/rooms/:room_id
router.get('/:room_id', roomController.getRoomById);

module.exports = router;
