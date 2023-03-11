const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const cors = require('cors');
const app = express();
app.use(cors());
connectDB();
console.log("wed devloper op")

app.use(express.json({ extended: false }));

//Define Routes
app.use("/api/room", require("./route/Room"));
app.use("/api/booking", require("./route/Booking"));

//Serve static assets in production
if (process.env.NODE_ENV === "production") {
  //Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));