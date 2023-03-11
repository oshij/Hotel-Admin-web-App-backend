const express = require('express');
const router = express.Router();
const Room = require("../model/Room");
const Booking = require('../model/Booking');

const { body, validationResult } = require("express-validator");
// Update the booking price when any of the booking details change
function updateBookingPrice(startTime, endTime, Roomtype) {
  // Calculate the duration of the booking in hours
  const durationInMs = endTime.getTime() - startTime.getTime();
  const durationInHours = durationInMs / (1000 * 60 * 60);

  // Calculate the price based on the room number and duration
  let price = 0;
  switch (Roomtype) {
    case "SINGLE":
      price = 50 * durationInHours;
      break;
    case "DOUBLE":
      price = 75 * durationInHours;
      break;
    case "DELUXE":
      price = 100 * durationInHours;
      break;
    default:
      break;
  }

  // Update the booking price in the database
  return price;
  
}

// Book a room
router.post('/',[
    body("email")
    .not()
    .isEmpty()
    .isEmail().withMessage("Must contain email"),
  body("roomNumber").not().isEmpty().withMessage("Room Number is required"),
  body("startTime").not().isEmpty().withMessage("Start time  is required"),
  body("endTime")
    .not()
    .isEmpty()
    .withMessage("End time is required"),
  
  
], async (req, res) => {
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, roomNumber, startTime, endTime } = req.body;


  try {
    const room = await Room.findOne({roomNumber:roomNumber})

    // Check if the requested booking overlaps with an existing booking for the same room
    const existingBooking = await Booking.findOne({ roomNumber, $or: [{ startTime: { $lte: startTime }, endTime: { $gt: startTime } }, { startTime: { $lt: endTime }, endTime: { $gte: endTime } }] });
    if (existingBooking) {
      return res.status(400).json({ message: 'This room is already booked during the requested time.' });
    }
    const price =  updateBookingPrice(new Date(startTime),new Date(endTime), room.type);
    const type = room.type
    // Create the new booking
    const booking = new Booking({ email, roomNumber, startTime, endTime, price, type });
    room.isBooked = true;
    // Save the new booking to the database
    const savedBooking = await booking.save();
    const updatedRoom = await room.save();
    

    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Room is Pre-Booked in this given Time Slot' });
  }
});

// Edit a booking
router.put('/:id', async (req, res) => {
    try {
      const { email, roomNumber, startTime, endTime } = req.body;
      const id = req.params.id;
  
      // Find the existing booking
      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }
  
      // Check if the requested booking overlaps with an existing booking for the same room
      const existingBooking = await Booking.findOne({ roomNumber, $or: [{ startTime: { $lte: startTime }, endTime: { $gt: startTime } }, { startTime: { $lt: endTime }, endTime: { $gte: endTime } }], _id: { $ne: id } });
      if (existingBooking) {
        return res.status(400).json({ message: 'This room is already booked during the requested time.' });
      }
      const room = await Room.findOne({roomNumber:roomNumber})
      // Update the booking details
      booking.email = email;
      booking.roomNumber = roomNumber;
      booking.startTime = startTime;
      booking.endTime = endTime;
      booking.type = room.type;
  
      // Calculate the new booking price
      const newPrice = await updateBookingPrice(new Date(startTime),new Date(endTime), room.type);
  
      // Confirm the price change with the admin
      const confirmed = req.body.confirmed;
      if (!confirmed) {
        return res.status(200).json({ message: 'Price updated.', price: newPrice });
      }
  
      // Update the booking price and status in the database
      booking.price = newPrice;
      booking.status = 'confirmed';
      await booking.save();
  
      res.status(200).json(booking);
    } catch (error) {
      res.status(500).json({ message: 'An error occurred while editing the booking.' });
    }
  });
  router.post('/:id/cancel', async (req, res) => {
    const booking = await Booking.findById(req.params.id);
  
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
  
    const now = new Date();
    const start_time = new Date(booking.startTime);
    console.log(now, start_time)

    let refund_amount = 0;
  
    if (start_time > now) {
      const hours_diff = Math.floor((start_time - now) / 1000 / 60 / 60);
      console.log(hours_diff)
      if (hours_diff > 48) {
        refund_amount = booking.price;
      } else if (hours_diff > 24) {
        refund_amount = booking.price / 2;
      }
    }
  
  
    const dbooking = await booking.deleteOne({ _id: req.params.id });
    console.log(refund_amount)
    return res.json({ message: 'Booking cancelled', refund_amount });
  });

  router.get('/', async (req, res) => {
    try {
      const roomNumber = req.body.roomNumber;
      const type = req.body.type;
      const startTime = req.body.startTime;
      const endTime = req.body.endTime;
  
      const filter = {};
  
      if (roomNumber) {
        filter.roomNumber = roomNumber;
      }
  
      if (type) {
        filter.type = type;
      }
      console.log(startTime, endTime);
  
      if (startTime && endTime) {
        filter.startTime = startTime ;
        filter.endTime = endTime;
      } else if (startTime) {
        filter.startTime = startTime;
      } else if (endTime) {
        filter.startTime = endTime;
      }
      console.log(filter);
  
      const bookings = await Booking.find(filter);
  
      return res.json(bookings);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
