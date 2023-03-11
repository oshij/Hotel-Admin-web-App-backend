const mongoose = require('mongoose')

const Schema = mongoose.Schema

const RoomSchema = new Schema({
    image: String,
    occupancy: Number,
    type: String,
    price: Number,
    roomNumber: Number,
    isBooked: {
        type: Boolean,
        default: false
    }
    
})

module.exports = new mongoose.model('Room', RoomSchema)