const express = require('express');
const router = express.Router({ mergeParams: true });
const Game = require('../models/Game');

const VALID_RESULTS = ['1H', '2H', '3H', 'HR', 'GO', 'FO', 'SO', 'DP', 'BB', 'HBP', 'SF', 'SH', 'E'];

function nextOpponentAtBatId(opponentAtBats) {
  const maxNum = opponentAtBats.reduce((max, oab) => {
    if (!oab.id) return max;
    const match = oab.id.match(/^oab(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `oab${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/games/:gameId/opponent-atbats
router.get('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }
    res.json({ success: true, data: game.opponentAtBats || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/opponent-atbats
router.post('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const { batterOrder, batterName, inning, result, rbi, run, pitcherId, note } = req.body;
    if (!batterOrder || !batterName || !inning || !result) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'batterOrder, batterName, inning, result 필드가 필요합니다' },
      });
    }
    if (!VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESULT_CODE', message: `지원하지 않는 타석 결과 코드입니다: ${result}` },
      });
    }

    const newOab = {
      id: nextOpponentAtBatId(game.opponentAtBats),
      batterOrder: Number(batterOrder),
      batterName: String(batterName),
      inning: Number(inning),
      result: String(result),
      rbi: rbi !== undefined ? Number(rbi) : 0,
      run: run !== undefined ? Number(run) : 0,
      pitcherId: pitcherId != null && pitcherId !== '' ? String(pitcherId) : '',
      note: note !== undefined ? String(note) : '',
    };

    game.opponentAtBats.push(newOab);
    await game.save();
    res.status(201).json({ success: true, data: newOab });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:gameId/opponent-atbats/:id
router.put('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const oab = game.opponentAtBats.find(o => o.id === req.params.id);
    if (!oab) {
      return res.status(404).json({
        success: false,
        error: { code: 'OPPONENT_ATBAT_NOT_FOUND', message: '상대 타석 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { batterOrder, batterName, inning, result, rbi, run, pitcherId, note } = req.body;
    if (result !== undefined && !VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESULT_CODE', message: `지원하지 않는 타석 결과 코드입니다: ${result}` },
      });
    }

    if (batterOrder !== undefined) oab.batterOrder = Number(batterOrder);
    if (batterName !== undefined) oab.batterName = String(batterName);
    if (inning !== undefined) oab.inning = Number(inning);
    if (result !== undefined) oab.result = String(result);
    if (rbi !== undefined) oab.rbi = Number(rbi);
    if (run !== undefined) oab.run = Number(run);
    if (pitcherId !== undefined) oab.pitcherId = pitcherId != null && pitcherId !== '' ? String(pitcherId) : '';
    if (note !== undefined) oab.note = String(note);

    await game.save();
    res.json({ success: true, data: oab });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:gameId/opponent-atbats/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const idx = game.opponentAtBats.findIndex(o => o.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'OPPONENT_ATBAT_NOT_FOUND', message: '상대 타석 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    game.opponentAtBats.splice(idx, 1);
    await game.save();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
