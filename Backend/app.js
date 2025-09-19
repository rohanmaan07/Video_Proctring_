const express = require("express");
const cors = require("cors");
const logRoutes = require("./Routes/logRoutes");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',          
  'https://video-proctring.vercel.app'  
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use("/api", logRoutes);

app.get("/", (req, res) => {
  res.send("Proctoring API Running...");
});

module.exports = app;
