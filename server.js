const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const noteRoutes = require('./routes/noteRoutes');
const startReminderCron = require('./cron/reminderCron');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/notesapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ ADD THIS ROOT ROUTE (fixes the 404 error)
app.get('/', (req, res) => {
    res.json({
        message: 'Notes API is running!',
        status: 'active',
        endpoints: {
            health: '/health',
            notes: '/api/notes',
            ai: '/api/notes/ai/summarize'
        },
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/notes', noteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start reminder cron job
startReminderCron();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Reminder system active - checking every minute`);
});