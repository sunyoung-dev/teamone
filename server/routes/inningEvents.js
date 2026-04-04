const express = require('express');
const router = express.Router({ mergeParams: true });
const Game = require('../models/Game');

const VALID_TYPES = ['SB', 'CS', 'WP', 'PB', 'BK', 'E', 'OB', 'DI', 'PK'];

function nextEventId(events) {
  const maxNum = (events || []).reduce((max, ev) => {
    if (!ev.id) return max;
    const match = ev.id.match(/^ie(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `ie${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/games/:gameId/inning-events
router.get('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다' },
      });
    }
    let events = game.inningEvents || [];
    if (req.query.inning) {
      const inning = Number(req.query.inning);
      events = events.filter(ev => ev.inning === inning);
    }
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/inning-events
router.post('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다' },
      });
    }

    const { inning, type, runnerName, pitcherId, fielderPos, fromBase, toBase, note } = req.body;

    if (!inning || !type) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'inning, type 필드가 필요합니다' },
      });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: `지원하지 않는 이벤트 유형입니다: ${type}` },
      });
    }

    const newEvent = {
      id: nextEventId(game.inningEvents),
      inning: Number(inning),
      type: String(type),
      runnerName: runnerName ? String(runnerName) : '',
      pitcherId: pitcherId ? String(pitcherId) : null,
      fielderPos: fielderPos != null ? Number(fielderPos) : null,
      fromBase: fromBase != null ? Number(fromBase) : null,
      toBase: toBase != null ? Number(toBase) : null,
      note: note ? String(note) : '',
    };

    game.inningEvents.push(newEvent);
    await game.save();

    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:gameId/inning-events/:eventId
router.put('/:eventId', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다' },
      });
    }

    const ev = (game.inningEvents || []).find(e => e.id === req.params.eventId);
    if (!ev) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: '이닝 이벤트를 찾을 수 없습니다' },
      });
    }

    const { inning, type, runnerName, pitcherId, fielderPos, fromBase, toBase, note } = req.body;

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: `지원하지 않는 이벤트 유형입니다: ${type}` },
      });
    }

    if (inning !== undefined) ev.inning = Number(inning);
    if (type !== undefined) ev.type = String(type);
    if (runnerName !== undefined) ev.runnerName = String(runnerName);
    if (pitcherId !== undefined) ev.pitcherId = pitcherId ? String(pitcherId) : null;
    if (fielderPos !== undefined) ev.fielderPos = fielderPos != null ? Number(fielderPos) : null;
    if (fromBase !== undefined) ev.fromBase = fromBase != null ? Number(fromBase) : null;
    if (toBase !== undefined) ev.toBase = toBase != null ? Number(toBase) : null;
    if (note !== undefined) ev.note = String(note);

    await game.save();
    res.json({ success: true, data: ev });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:gameId/inning-events/:eventId
router.delete('/:eventId', async (req, res, next) => {
  try {
    const gameExists = await Game.exists({ _id: req.params.gameId });
    if (!gameExists) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다' },
      });
    }

    const result = await Game.updateOne(
      { _id: req.params.gameId },
      { $pull: { inningEvents: { id: req.params.eventId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'EVENT_NOT_FOUND', message: '이닝 이벤트를 찾을 수 없습니다' },
      });
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
