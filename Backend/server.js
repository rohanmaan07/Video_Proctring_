require('dotenv').config();
const app = require('./app');
const connectDb = require('./config/db'); 

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb(); 
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();