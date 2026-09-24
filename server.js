const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows our server to read JSON data sent from the user

// 1. Import our route files
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const assignmentRoutes = require('./routes/assignments'); // Import assignments routes
const webhookRoutes = require('./routes/webhooks');
// 2. Register the routes with Express
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/assignments', assignmentRoutes); // Link assignment routes
app.use('/api/v1/zoom', webhookRoutes);
// Simple test route to check if our server is active
app.get('/', (req, res) => {
    res.json({ message: 'Live Student Portal API is running smoothly!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});