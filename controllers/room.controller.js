// File: controllers/room.controller.js

const dbPool = require('../config/db.config');

/**
 * Retrieve available rooms based on a requested date range.
 * This endpoint accepts query parameters `check_in` and `check_out`
 * and returns rooms that are not booked for the selected range.
 */
exports.getAvailableRooms = async (req, res) => {
    const { check_in, check_out } = req.query;

    console.log("Searching rooms for:", check_in, check_out);

    if (!check_in || !check_out) {
        return res.status(400).json({
            message: "Missing check_in or check_out date",
        });
    }

    try {
        // Correct, simplified, industry-standard overlap logic
        const sqlQuery = `
            SELECT *
            FROM rooms r
            WHERE r.is_available = TRUE
            AND r.room_id NOT IN (
                SELECT room_id
                FROM reservations
                WHERE NOT (
                    check_out_date <= ? OR
                    check_in_date >= ?
                )
            );
        `;

        // Check_in and check_out must be in the correct YYYY-MM-DD format
        const [rows] = await dbPool.execute(sqlQuery, [check_in, check_out]);

        return res.status(200).json({
            message: 'Available rooms retrieved successfully',
            count: rows.length,
            rooms: rows,
        });
    } catch (error) {
        console.error('Error fetching available rooms:', error);
        return res.status(500).json({
            message: 'Failed to search for available rooms.',
            error: error.message,
        });
    }
};

/**
 * Get details for a specific room by ID.
 */
exports.getRoomById = async (req, res) => {
    const { room_id } = req.params;

    if (!room_id) {
        return res.status(400).json({
            message: 'Missing room_id parameter.',
        });
    }

    try {
        const [rows] = await dbPool.execute(
            'SELECT * FROM rooms WHERE room_id = ?',
            [room_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                message: 'Room not found.',
            });
        }

        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error retrieving room by ID:', error);
        return res.status(500).json({
            message: 'Failed to retrieve room.',
            error: error.message,
        });
    }
};
