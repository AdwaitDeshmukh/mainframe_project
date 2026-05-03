const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'VPay Backend Running ✅' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 VPay Backend running on http://localhost:${PORT}`);
});
