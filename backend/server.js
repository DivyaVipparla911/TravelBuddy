const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const profileRoutes = require('./routes/profileRoutes');

// Load environment variables
// dotenv.config();
require("dotenv").config({ path:"./config/.env"}); 

// Connect to MongoDB Atlas
connectDB();

const app = express();
const testRoute = require('./routes/testRoute');
app.use('/api/test', testRoute);


// Middleware
app.use(express.json());

// Routes
app.use('/api/profile', require('./routes/profileRoutes'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
