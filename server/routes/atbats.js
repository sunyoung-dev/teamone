const express = require('express');
const router = express.Router({ mergeParams: true });
const Game = require('../models/Game');

const VALID_RESULTS = ['1H', '2H', '3H', 'HR', 'GO', 'FO', 'SO', 'DP', 'BB', 'HBP', 'SF', 'SH', 'E'];

function nextAtBatId(atBats) {
  const maxNum = atBats.reduce((max, ab) => {
    if (!ab.id) return max;
    const match = ab.id.match(/^ab(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `ab${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/games/:gameId/atbats
router.get('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }
    let atBats = game.atBats || [];
    if (req.query.inning) {
      const inning = Number(req.query.inning);
      atBats = atBats.filter(ab => ab.inning === inning);
    }
    res.json({ success: true, data: atBats });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/atbats
router.post('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const { inning, playerId, result, order, run, rbi, note } = req.body;
    if (!inning || !playerId || !result || !order) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'inning, playerId, result, order 필드가 필요합니다' },
      });
    }
    if (!VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESULT_CODE', message: `지원하지 않는 타석 결과 코드입니다: ${result}` },
      });
    }

    const newAtBat = {
      id: nextAtBatId(game.atBats),
      inning: Number(inning),
      playerId: String(playerId),
      result: String(result),
      order: Number(order),
      run: run !== undefined ? Number(run) : 0,
      rbi: rbi !== undefined ? Number(rbi) : 0,
      note: note !== undefined ? String(note) : '',
    };

    game.atBats.push(newAtBat);
    await game.save();

    res.status(201).json({ success: true, data: newAtBat });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:gameId/atbats/:atbatId
router.put('/:atbatId', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const ab = game.atBats.find(a => a.id === req.params.atbatId);
    if (!ab) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATBAT_NOT_FOUND', message: '타석 기록을 찾을 수 없습니다', details: { id: req.params.atbatId } },
      });
    }

    const { inning, playerId, result, order, run, rbi, note } = req.body;
    if (result !== undefined && !VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESULT_CODE', message: `지원하지 않는 타석 결과 코드입니다: ${result}` },
      });
    }

    if (inning !== undefined) ab.inning = Number(inning);
    if (playerId !== undefined) ab.playerId = String(playerId);
    if (result !== undefined) ab.result = String(result);
    if (order !== undefined) ab.order = Number(order);
    if (run !== undefined) ab.run = Number(run);
    if (rbi !== undefined) ab.rbi = Number(rbi);
    if (note !== undefined) ab.note = String(note);

    await game.save();
    res.json({ success: true, data: ab });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:gameId/atbats/:atbatId
router.delete('/:atbatId', async (req, res, next) => {
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
      { $pull: { atBats: { id: req.params.atbatId } } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'ATBAT_NOT_FOUND', message: '타석 기록을 찾을 수 없습니다', details: { id: req.params.atbatId } },
      });
    }

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
