// File: controllers/reservation.controller.js

const dbPool = require('../config/db.config');

/**
 * Create a new reservation.
 * Expects request body containing user_id, room_id, check_in_date, check_out_date and total_price.
 * Responds with the inserted reservation ID on success or an error message on failure.
 *
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
exports.createReservation = async (req, res) => {
    const { user_id, room_id, check_in_date, check_out_date, total_price } = req.body;

    // Validate required fields
    if (!user_id || !room_id || !check_in_date || !check_out_date) {
        return res.status(400).json({ message: 'Missing required reservation details (user_id, room_id, dates).' });
    }

    // Prepare dates and default price
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const totalPrice = total_price || 0;

    const sqlQuery = `
        INSERT INTO reservations (user_id, room_id, check_in_date, check_out_date, total_price, status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
    `;
    const queryParams = [user_id, room_id, checkIn, checkOut, totalPrice];

    try {
        const [result] = await dbPool.execute(sqlQuery, queryParams);
        return res.status(201).json({
            message: 'Reservation successfully created.',
            reservationId: result.insertId,
            data: {
                userId: user_id,
                roomId: room_id,
                checkIn: checkIn.toISOString().split('T')[0],
            },
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        return res.status(500).json({ message: 'Failed to create reservation.', error: error.message });
    }
};

/**
 * Retrieve all reservations for a given user.
 * Returns an array of reservation objects, ordered by check_in_date.
 *
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
exports.getUserReservations = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'Missing user_id parameter.' });
    }
    try {
        const sqlQuery = `SELECT * FROM reservations WHERE user_id = ? ORDER BY check_in_date`;
        const [rows] = await dbPool.execute(sqlQuery, [user_id]);
        return res.status(200).json({ reservations: rows });
    } catch (error) {
        console.error('Error retrieving reservations:', error);
        return res.status(500).json({ message: 'Failed to retrieve reservations.', error: error.message });
    }
};
