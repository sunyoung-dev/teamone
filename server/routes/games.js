const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const nextId = require('../utils/nextId');
const atBatsRouter = require('./atbats');
const opponentAtbatsRouter = require('./opponentAtbats');
const pitchingRouter = require('./pitching');
const substitutionsRouter = require('./substitutions');
const inningEventsRouter = require('./inningEvents');
const { validateLineup, VALID_RESULTS, VALID_STATUSES } = require('../services/gameService');

// GET /api/games
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.season) filter.date = { $regex: `^${req.query.season}` };

    const games = await Game.find(filter).sort({ date: -1 });
    res.json({ success: true, data: games });
  } catch (err) {
    next(err);
  }
});

// GET /api/games/:id
router.get('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    res.json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
});

// POST /api/games
router.post('/', async (req, res, next) => {
  try {
    const { date, opponent, venue, result, scoreOurs, scoreTheirs, innings, status, lineup, leagueId, round } = req.body;

    if (!date || !opponent) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'date, opponent 필드가 필요합니다' },
      });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다` },
      });
    }
    if (result !== undefined && !VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'result는 W, L, D, null 중 하나여야 합니다' },
      });
    }
    if (lineup && Array.isArray(lineup)) {
      const lineupError = validateLineup(lineup);
      if (lineupError) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_LINEUP', message: lineupError } });
      }
    }

    const id = await nextId(Game, 'g');
    const game = new Game({
      _id: id,
      date: String(date),
      opponent: String(opponent),
      venue: venue ? String(venue) : '',
      result: result !== undefined ? result : null,
      scoreOurs: scoreOurs !== undefined ? Number(scoreOurs) : 0,
      scoreTheirs: scoreTheirs !== undefined ? Number(scoreTheirs) : 0,
      innings: innings !== undefined ? Number(innings) : 7,
      status: status || 'scheduled',
      leagueId: leagueId || null,
      round: round ? String(round) : '',
      lineup: lineup && Array.isArray(lineup) ? lineup : [],
      atBats: [],
    });
    await game.save();

    res.status(201).json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:id
router.put('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { date, opponent, venue, result, scoreOurs, scoreTheirs, innings, status, lineup, leagueId, round } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다` },
      });
    }
    if (result !== undefined && !VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'result는 W, L, D, null 중 하나여야 합니다' },
      });
    }
    if (lineup && Array.isArray(lineup)) {
      const lineupError = validateLineup(lineup);
      if (lineupError) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_LINEUP', message: lineupError } });
      }
    }

    if (date !== undefined) game.date = String(date);
    if (opponent !== undefined) game.opponent = String(opponent);
    if (venue !== undefined) game.venue = String(venue);
    if (result !== undefined) game.result = result;
    if (scoreOurs !== undefined) game.scoreOurs = Number(scoreOurs);
    if (scoreTheirs !== undefined) game.scoreTheirs = Number(scoreTheirs);
    if (innings !== undefined) game.innings = Number(innings);
    if (status !== undefined) game.status = status;
    if (leagueId !== undefined) game.leagueId = leagueId || null;
    if (round !== undefined) game.round = round ? String(round) : '';
    if (lineup !== undefined) game.lineup = lineup;

    await game.save();
    res.json({ success: true, data: game });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    await game.deleteOne();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/games/:id/lineup
router.get('/:id/lineup', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    res.json({ success: true, data: game.lineup || [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:id/lineup
router.put('/:id/lineup', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { lineup } = req.body;
    if (!Array.isArray(lineup)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'lineup 배열이 필요합니다' } });
    }
    const lineupError = validateLineup(lineup);
    if (lineupError) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_LINEUP', message: lineupError } });
    }

    game.lineup = lineup;
    await game.save();
    res.json({ success: true, data: game.lineup });
  } catch (err) {
    next(err);
  }
});

// GET /api/games/:id/opponent-lineup
router.get('/:id/opponent-lineup', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    res.json({ success: true, data: game.opponentLineup || [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:id/opponent-lineup
router.put('/:id/opponent-lineup', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { lineup } = req.body;
    if (!Array.isArray(lineup)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'lineup 배열이 필요합니다' } });
    }
    for (const entry of lineup) {
      if (!entry.order || !entry.name) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'opponentLineup 각 항목에 order, name 필드가 필요합니다' },
        });
      }
    }

    // Sync batterName in opponentAtBats when a player's name changes
    // Match by order (타순) which is stable, not by id which may be absent
    const oldByOrder = {};
    for (const e of (game.opponentLineup || [])) {
      if (e.order != null) oldByOrder[e.order] = e;
    }
    const nameChanges = {};
    for (const newEntry of lineup) {
      if (newEntry.order == null) continue;
      const oldEntry = oldByOrder[newEntry.order];
      if (oldEntry && oldEntry.name && oldEntry.name !== newEntry.name) {
        nameChanges[oldEntry.name] = newEntry.name;
      }
    }
    if (Object.keys(nameChanges).length > 0) {
      for (const oab of (game.opponentAtBats || [])) {
        if (nameChanges[oab.batterName]) {
          oab.batterName = nameChanges[oab.batterName];
        }
      }
    }

    game.opponentLineup = lineup;
    await game.save();
    res.json({ success: true, data: game.opponentLineup });
  } catch (err) {
    next(err);
  }
});

// Mount sub-routers
router.use('/:gameId/atbats', atBatsRouter);
router.use('/:gameId/opponent-atbats', opponentAtbatsRouter);
router.use('/:gameId/pitching', pitchingRouter);
router.use('/:gameId/substitutions', substitutionsRouter);
router.use('/:gameId/inning-events', inningEventsRouter);

module.exports = router;
