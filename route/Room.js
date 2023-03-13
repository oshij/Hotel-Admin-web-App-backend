const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Room = require("../model/Room");

router.post(
    "/",
    [
        body("image")
        .not()
        .isEmpty()
        .withMessage("Must contain product image"),
      body("occupancy").not().isEmpty().withMessage("Occupancy is required"),
      body("type").not().isEmpty().withMessage("Type is required"),
      body("price")
        .not()
        .isEmpty()
        .withMessage("Price is required"),
      body("roomNumber").not().isEmpty().withMessage("Room Number is required"),
      
      
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const {
        image,
        occupancy,
        type,
        price,
        roomNumber,
      } = req.body;
      console.log("image",image)
  
      try {
        const room = new Room({
            image,
            occupancy,
            type,
            price,
            roomNumber,
        });
        const isRoom = await Room.findOne({roomNumber:roomNumber})
        if(isRoom)
        {
          return res.status(400).json("Room Number is already Taken, Please select another Room Number");
        }

        await room.save();
        res.json(room);
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
  
        console.log(req.body);
      }
    }
  );
  router.get('/', async (req, res) => {
    try {
      const rooms = await Room.find();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  

  module.exports = router