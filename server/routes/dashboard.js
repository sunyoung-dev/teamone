const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Game = require('../models/Game');
const { calculateStats } = require('./stats');

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const [players, games] = await Promise.all([
      Player.find({ active: true }).lean(),
      Game.find().lean()
    ]);

    // lean() returns plain objects with _id, map to id
    const normGame = g => ({ ...g, id: g._id });
    const normPlayer = p => ({ ...p, id: p._id });

    const normalizedGames = games.map(normGame);
    const normalizedPlayers = players.map(normPlayer);

    // Sort all games by date descending
    const sortedGames = normalizedGames.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Team record from final games
    const finalGames = normalizedGames.filter(g => g.status === 'final');
    const wins = finalGames.filter(g => g.result === 'W').length;
    const losses = finalGames.filter(g => g.result === 'L').length;
    const draws = finalGames.filter(g => g.result === 'D').length;
    const gamesPlayed = finalGames.length;
    const winPct = gamesPlayed > 0 ? round3(wins / gamesPlayed) : 0;

    const teamRecord = { wins, losses, draws, winPct };

    // Recent 5 final games
    const recentGames = sortedGames
      .filter(g => g.status === 'final')
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        date: g.date,
        opponent: g.opponent,
        scoreOurs: g.scoreOurs,
        scoreTheirs: g.scoreTheirs,
        result: g.result,
        leagueId: g.leagueId || null,
      }));

    // Team batting stats from all final games
    const allAtBats = finalGames.flatMap(g => g.atBats || []);
    const teamBatting = calculateStats(allAtBats);
    const teamStats = {
      avg: teamBatting.avg,
      obp: teamBatting.obp,
      slg: teamBatting.slg,
      ops: teamBatting.ops
    };

    // Leaders: top 3 by AVG, HR, H (with at least 1 AB)
    const atBatsByPlayer = {};
    for (const game of finalGames) {
      for (const ab of (game.atBats || [])) {
        if (!atBatsByPlayer[ab.playerId]) atBatsByPlayer[ab.playerId] = [];
        atBatsByPlayer[ab.playerId].push(ab);
      }
    }

    const playerStats = normalizedPlayers
      .map(player => {
        const pAtBats = atBatsByPlayer[player.id] || [];
        const stats = calculateStats(pAtBats);
        return { playerId: player.id, name: player.name, ...stats };
      })
      .filter(s => s.atBats > 0);

    function top3(field) {
      return playerStats
        .slice()
        .sort((a, b) => (b[field] || 0) - (a[field] || 0))
        .slice(0, 3)
        .map(s => ({ playerId: s.playerId, name: s.name, value: s[field] }));
    }

    const leaders = {
      avg: top3('avg'),
      homeRuns: top3('homeRuns'),
      hits: top3('hits')
    };

    // In-progress games
    const inProgressGames = sortedGames
      .filter(g => g.status === 'in_progress')
      .map(g => ({ id: g.id, date: g.date, opponent: g.opponent, venue: g.venue, leagueId: g.leagueId || null }));

    // Upcoming scheduled games (today or later, sorted ascending)
    const today = new Date().toISOString().slice(0, 10);
    const upcomingGames = normalizedGames
      .filter(g => g.status === 'scheduled' && (g.date || '') >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map(g => ({ id: g.id, date: g.date, opponent: g.opponent, venue: g.venue, leagueId: g.leagueId || null }));

    res.json({
      success: true,
      data: {
        teamRecord,
        inProgressGames,
        recentGames,
        teamStats,
        leaders,
        upcomingGames
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
