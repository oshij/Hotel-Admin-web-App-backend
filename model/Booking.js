const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    email: { type: String, required: true },
    roomNumber: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    type : {type : String, required: true},
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['unconfirmed', 'confirmed'], default: 'confirmed' },
});

// Ensure no two bookings have overlapping start and end time for the same room
bookingSchema.index({ roomNumber: 1, startTime: 1, endTime: 1 }, { unique: true });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
