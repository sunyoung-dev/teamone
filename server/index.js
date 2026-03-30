require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

const playersRouter = require('./routes/players');
const gamesRouter = require('./routes/games');
const statsRouter = require('./routes/stats');
const dashboardRouter = require('./routes/dashboard');
const leaguesRouter = require('./routes/leagues');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamone';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/leagues', leaguesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '요청한 엔드포인트를 찾을 수 없습니다' } });
});

// Global error handler
app.use(errorHandler);

// Serve React client in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`TeamOne WB server running on http://localhost:${PORT}`);
      console.log(`CORS enabled for http://localhost:5173`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
