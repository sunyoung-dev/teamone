const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Game = require('../models/Game');

// At-bat result classification
const HITS = ['1H', '2H', '3H', 'HR'];
const TOTAL_BASES = { '1H': 1, '2H': 2, '3H': 3, 'HR': 4 };

function count(atBats, result) {
  return atBats.filter(ab => ab.result === result).length;
}

function countIn(atBats, results) {
  return atBats.filter(ab => results.includes(ab.result)).length;
}

function sumTotalBases(atBats) {
  return atBats.reduce((sum, ab) => sum + (TOTAL_BASES[ab.result] || 0), 0);
}

function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function calculateStats(atBats) {
  const pa = atBats.length;
  const bb = count(atBats, 'BB');
  const hbp = count(atBats, 'HBP');
  const sf = count(atBats, 'SF');
  const sh = count(atBats, 'SH');
  const ab = pa - bb - hbp - sf - sh;
  const h = countIn(atBats, HITS);
  const singles = count(atBats, '1H');
  const doubles = count(atBats, '2H');
  const triples = count(atBats, '3H');
  const homeRuns = count(atBats, 'HR');
  const strikeouts = count(atBats, 'SO');
  const groundOuts = count(atBats, 'GO');
  const flyOuts = count(atBats, 'FO');
  const doublePlays = count(atBats, 'DP');
  const errors = count(atBats, 'E');
  const tb = sumTotalBases(atBats);

  const avg = ab > 0 ? round3(h / ab) : 0;
  const obpDenom = ab + bb + hbp + sf;
  const obp = obpDenom > 0 ? round3((h + bb + hbp) / obpDenom) : 0;
  const slg = ab > 0 ? round3(tb / ab) : 0;
  const ops = round3(obp + slg);

  return {
    plateAppearances: pa,
    atBats: ab,
    hits: h,
    singles,
    doubles,
    triples,
    homeRuns,
    walks: bb,
    hitByPitch: hbp,
    strikeouts,
    sacrificeFlies: sf,
    sacrificeBunts: sh,
    groundOuts,
    flyOuts,
    doublePlays,
    errors,
    totalBases: tb,
    avg,
    obp,
    slg,
    ops
  };
}

// GET /api/stats/players - computed batting stats for all players
router.get('/players', async (req, res, next) => {
  try {
    const [players, games] = await Promise.all([
      Player.find().lean(),
      Game.find().lean()
    ]);

    const { season } = req.query;

    const atBatsByPlayer = {};
    const gamesPlayedByPlayer = {};

    for (const game of games) {
      if (season && game.date && !game.date.startsWith(season)) continue;

      for (const ab of (game.atBats || [])) {
        if (!atBatsByPlayer[ab.playerId]) atBatsByPlayer[ab.playerId] = [];
        atBatsByPlayer[ab.playerId].push(ab);
      }

      const lineupPlayerIds = new Set((game.lineup || []).map(l => l.playerId));
      for (const playerId of lineupPlayerIds) {
        gamesPlayedByPlayer[playerId] = (gamesPlayedByPlayer[playerId] || 0) + 1;
      }
    }

    const statsAll = players.map(player => {
      const playerAtBats = atBatsByPlayer[player._id] || [];
      const stats = calculateStats(playerAtBats);
      return {
        playerId: player._id,
        playerName: player.name,
        number: player.number,
        position: player.position,
        gamesPlayed: gamesPlayedByPlayer[player._id] || 0,
        ...stats
      };
    });

    res.json({ success: true, data: statsAll });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/players/:playerId - stats for one player
router.get('/players/:playerId', async (req, res, next) => {
  try {
    const [player, games] = await Promise.all([
      Player.findById(req.params.playerId).lean(),
      Game.find().lean()
    ]);

    if (!player) {
      return res.status(404).json({
        success: false,
        error: { code: 'PLAYER_NOT_FOUND', message: '선수를 찾을 수 없습니다', details: { id: req.params.playerId } }
      });
    }

    const { season } = req.query;

    const playerAtBats = [];
    let gamesPlayed = 0;

    for (const game of games) {
      if (season && game.date && !game.date.startsWith(season)) continue;

      const inLineup = (game.lineup || []).some(l => l.playerId === player._id);
      if (inLineup) gamesPlayed++;

      const gameAtBats = (game.atBats || []).filter(ab => ab.playerId === player._id);
      playerAtBats.push(...gameAtBats);
    }

    const stats = calculateStats(playerAtBats);

    res.json({
      success: true,
      data: {
        playerId: player._id,
        playerName: player.name,
        number: player.number,
        position: player.position,
        gamesPlayed,
        ...stats
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/team - team overall stats
router.get('/team', async (req, res, next) => {
  try {
    const games = await Game.find().lean();

    const { season } = req.query;

    let filteredGames = games;
    if (season) {
      filteredGames = games.filter(g => g.date && g.date.startsWith(season));
    }

    const finalGames = filteredGames.filter(g => g.status === 'final');

    const wins = finalGames.filter(g => g.result === 'W').length;
    const losses = finalGames.filter(g => g.result === 'L').length;
    const draws = finalGames.filter(g => g.result === 'D').length;
    const gamesPlayed = finalGames.length;
    const winPct = gamesPlayed > 0 ? round3(wins / gamesPlayed) : 0;

    const runsScored = finalGames.reduce((sum, g) => sum + (g.scoreOurs || 0), 0);
    const runsAllowed = finalGames.reduce((sum, g) => sum + (g.scoreTheirs || 0), 0);

    const allAtBats = filteredGames.flatMap(g => g.atBats || []);
    const teamBattingStats = calculateStats(allAtBats);

    res.json({
      success: true,
      data: {
        season: season || null,
        gamesPlayed,
        wins,
        losses,
        draws,
        winPct,
        runsScored,
        runsAllowed,
        teamAvg: teamBattingStats.avg,
        teamObp: teamBattingStats.obp,
        teamSlg: teamBattingStats.slg,
        teamOps: teamBattingStats.ops
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/leaders - top players by category
router.get('/leaders', async (req, res, next) => {
  try {
    const [players, games] = await Promise.all([
      Player.find({ active: true }).lean(),
      Game.find().lean()
    ]);

    const { category = 'avg', limit = 5 } = req.query;
    const limitNum = Math.min(Number(limit) || 5, 50);

    const atBatsByPlayer = {};
    for (const game of games) {
      for (const ab of (game.atBats || [])) {
        if (!atBatsByPlayer[ab.playerId]) atBatsByPlayer[ab.playerId] = [];
        atBatsByPlayer[ab.playerId].push(ab);
      }
    }

    const statsAll = players
      .map(player => {
        const playerAtBats = atBatsByPlayer[player._id] || [];
        const stats = calculateStats(playerAtBats);
        return { playerId: player._id, name: player.name, ...stats };
      })
      .filter(s => s.atBats > 0);

    const VALID_CATEGORIES = ['avg', 'obp', 'slg', 'ops', 'hits', 'homeRuns', 'walks', 'strikeouts', 'plateAppearances'];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `category는 ${VALID_CATEGORIES.join(', ')} 중 하나여야 합니다` }
      });
    }

    const sorted = statsAll
      .sort((a, b) => (b[category] || 0) - (a[category] || 0))
      .slice(0, limitNum)
      .map(s => ({ playerId: s.playerId, name: s.name, value: s[category] }));

    res.json({ success: true, data: sorted });
  } catch (err) {
    next(err);
  }
});

// GET /api/stats/pitching - pitcher stats for all players across all games
router.get('/pitching', async (req, res, next) => {
  try {
    const [players, games] = await Promise.all([
      Player.find().lean(),
      Game.find().lean()
    ]);

    const { season } = req.query;

    const pitchingByPitcher = {};
    const opponentAtBatsByPitcher = {};
    const gamesByPitcher = {};

    for (const game of games) {
      if (season && game.date && !game.date.startsWith(season)) continue;

      const pitcherIdsInGame = new Set();

      // Build inning → pitcherId map from pitching records for auto-attribution
      const inningPitcherMap = {};
      for (const record of (game.pitching || [])) {
        const pid = record.pitcherId;
        if (!pid) continue;
        if (!pitchingByPitcher[pid]) pitchingByPitcher[pid] = [];
        pitchingByPitcher[pid].push(record);
        pitcherIdsInGame.add(pid);
        for (let inn = record.startInning; inn <= record.endInning; inn++) {
          inningPitcherMap[inn] = pid;
        }
      }

      for (const oab of (game.opponentAtBats || [])) {
        // Use explicit pitcherId; fall back to inning-based attribution
        const pid = oab.pitcherId || inningPitcherMap[oab.inning];
        if (!pid) continue;
        if (!opponentAtBatsByPitcher[pid]) opponentAtBatsByPitcher[pid] = [];
        opponentAtBatsByPitcher[pid].push(oab);
        pitcherIdsInGame.add(pid);
      }

      for (const pid of pitcherIdsInGame) {
        gamesByPitcher[pid] = (gamesByPitcher[pid] || 0) + 1;
      }
    }

    const statsAll = players.map(player => {
      const records = pitchingByPitcher[player._id] || [];
      const oabs = opponentAtBatsByPitcher[player._id] || [];

      const ip = records.reduce((sum, r) => {
        const span = (r.endInning || 0) - (r.startInning || 0) + 1;
        return sum + (span > 0 ? span : 0);
      }, 0);
      const tbf = oabs.length;
      const h = oabs.filter(oab => ['1H', '2H', '3H', 'HR'].includes(oab.result)).length;
      const hr = oabs.filter(oab => oab.result === 'HR').length;
      const so = oabs.filter(oab => oab.result === 'SO').length;
      const bb = oabs.filter(oab => ['BB', 'HBP'].includes(oab.result)).length;
      const r = oabs.reduce((sum, oab) => sum + (oab.run || 0), 0);
      const er = r;
      const era = ip > 0 ? Math.round((er / ip) * 9 * 100) / 100 : 0;

      return {
        playerId: player._id,
        playerName: player.name,
        number: player.number,
        position: player.position,
        games: gamesByPitcher[player._id] || 0,
        ip,
        tbf,
        h,
        hr,
        so,
        bb,
        r,
        er,
        era
      };
    });

    res.json({ success: true, data: statsAll });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.calculateStats = calculateStats;
