const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const playersRouter = require('./routes/players');
const gamesRouter = require('./routes/games');
const statsRouter = require('./routes/stats');
const dashboardRouter = require('./routes/dashboard');
const leaguesRouter = require('./routes/leagues');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

// Ensure data directory and default files exist
async function ensureDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const playersPath = path.join(DATA_DIR, 'players.json');
    const gamesPath = path.join(DATA_DIR, 'games.json');
    const leaguesPath = path.join(DATA_DIR, 'leagues.json');

    try {
      await fs.access(playersPath);
    } catch {
      await fs.writeFile(playersPath, JSON.stringify({ players: [] }, null, 2), 'utf-8');
      console.log('Created default players.json');
    }

    try {
      await fs.access(gamesPath);
    } catch {
      await fs.writeFile(gamesPath, JSON.stringify({ games: [] }, null, 2), 'utf-8');
      console.log('Created default games.json');
    }

    try {
      await fs.access(leaguesPath);
    } catch {
      await fs.writeFile(leaguesPath, JSON.stringify({ leagues: [] }, null, 2), 'utf-8');
      console.log('Created default leagues.json');
    }
  } catch (err) {
    console.error('Failed to initialize data directory:', err);
    process.exit(1);
  }
}

ensureDataFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`TeamOne WB server running on http://localhost:${PORT}`);
    console.log(`CORS enabled for http://localhost:5173`);
  });
});
