// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import routes
const recommendationRoutes = require('./routes/recommendTrip');
const emailRoute = require('./routes/sendJoinRequestEmail');

// Use routes
app.use('/', recommendationRoutes);
app.use('/', emailRoute);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Travel AI API is running!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});