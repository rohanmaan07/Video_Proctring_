const express = require("express");
const cors = require("cors");
const logRoutes = require("./Routes/logRoutes");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", logRoutes);

app.get("/", (req, res) => {
  res.send("Proctoring API Running...");
});

module.exports = app;
