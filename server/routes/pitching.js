const express = require('express');
const router = express.Router({ mergeParams: true });
const Game = require('../models/Game');

function nextPitchingId(pitching) {
  const maxNum = pitching.reduce((max, p) => {
    if (!p.id) return max;
    const match = p.id.match(/^pit(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `pit${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/games/:gameId/pitching
router.get('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }
    res.json({ success: true, data: game.pitching || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/pitching
router.post('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const { pitcherId, startInning, endInning, pitchCount } = req.body;
    if (!pitcherId || startInning === undefined || endInning === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'pitcherId, startInning, endInning 필드가 필요합니다' },
      });
    }

    const newRecord = {
      id: nextPitchingId(game.pitching),
      pitcherId: String(pitcherId),
      startInning: Number(startInning),
      endInning: Number(endInning),
      pitchCount: pitchCount !== undefined ? Number(pitchCount) : 0,
    };

    game.pitching.push(newRecord);
    await game.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:gameId/pitching/:id
router.put('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const record = game.pitching.find(p => p.id === req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { code: 'PITCHING_NOT_FOUND', message: '투구 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { pitcherId, startInning, endInning, pitchCount } = req.body;
    if (pitcherId !== undefined) record.pitcherId = String(pitcherId);
    if (startInning !== undefined) record.startInning = Number(startInning);
    if (endInning !== undefined) record.endInning = Number(endInning);
    if (pitchCount !== undefined) record.pitchCount = Number(pitchCount);

    await game.save();
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:gameId/pitching/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const gameExists = await Game.exists({ _id: req.params.gameId });
    if (!gameExists) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const result = await Game.updateOne(
      { _id: req.params.gameId },
      { $pull: { pitching: { id: req.params.id } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'PITCHING_NOT_FOUND', message: '투구 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
