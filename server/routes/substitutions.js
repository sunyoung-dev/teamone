const express = require('express');
const router = express.Router({ mergeParams: true });
const Game = require('../models/Game');

const VALID_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

function nextSubstitutionId(substitutions) {
  const maxNum = substitutions.reduce((max, s) => {
    if (!s.id) return max;
    const match = s.id.match(/^sub(\d+)$/);
    if (!match) return max;
    const num = parseInt(match[1], 10);
    return num > max ? num : max;
  }, 0);
  return `sub${String(maxNum + 1).padStart(3, '0')}`;
}

// GET /api/games/:gameId/substitutions
router.get('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }
    const substitutions = (game.substitutions || []).slice().sort((a, b) => a.inning - b.inning);
    res.json({ success: true, data: substitutions });
  } catch (err) {
    next(err);
  }
});

// POST /api/games/:gameId/substitutions
router.post('/', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const { inning, outPlayerId, outPlayerName, inPlayerId, inPlayerName, battingOrder, position, isOpponent } = req.body;

    if (!inning || !battingOrder || !position) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'inning, battingOrder, position 필드가 필요합니다' },
      });
    }
    if (!outPlayerId && !outPlayerName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'outPlayerId 또는 outPlayerName 중 하나가 필요합니다' },
      });
    }
    if (!inPlayerId && !inPlayerName) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'inPlayerId 또는 inPlayerName 중 하나가 필요합니다' },
      });
    }
    if (!VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `position은 ${VALID_POSITIONS.join(', ')} 중 하나여야 합니다` },
      });
    }

    const newSub = {
      id: nextSubstitutionId(game.substitutions),
      inning: Number(inning),
      outPlayerId: outPlayerId || null,
      outPlayerName: outPlayerName || null,
      inPlayerId: inPlayerId || null,
      inPlayerName: inPlayerName || null,
      battingOrder: Number(battingOrder),
      position: String(position),
      isOpponent: isOpponent === true || isOpponent === 'true',
    };

    game.substitutions.push(newSub);
    await game.save();
    res.status(201).json({ success: true, data: newSub });
  } catch (err) {
    next(err);
  }
});

// PUT /api/games/:gameId/substitutions/:id
router.put('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const sub = game.substitutions.find(s => s.id === req.params.id);
    if (!sub) {
      return res.status(404).json({
        success: false,
        error: { code: 'SUBSTITUTION_NOT_FOUND', message: '선수 교체 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { inning, outPlayerId, outPlayerName, inPlayerId, inPlayerName, battingOrder, position, isOpponent } = req.body;

    if (position !== undefined && !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `position은 ${VALID_POSITIONS.join(', ')} 중 하나여야 합니다` },
      });
    }

    if (inning !== undefined) sub.inning = Number(inning);
    if (outPlayerId !== undefined) sub.outPlayerId = outPlayerId || null;
    if (outPlayerName !== undefined) sub.outPlayerName = outPlayerName || null;
    if (inPlayerId !== undefined) sub.inPlayerId = inPlayerId || null;
    if (inPlayerName !== undefined) sub.inPlayerName = inPlayerName || null;
    if (battingOrder !== undefined) sub.battingOrder = Number(battingOrder);
    if (position !== undefined) sub.position = String(position);
    if (isOpponent !== undefined) sub.isOpponent = isOpponent === true || isOpponent === 'true';

    await game.save();
    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/games/:gameId/substitutions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        error: { code: 'GAME_NOT_FOUND', message: '경기를 찾을 수 없습니다', details: { id: req.params.gameId } },
      });
    }

    const idx = game.substitutions.findIndex(s => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'SUBSTITUTION_NOT_FOUND', message: '선수 교체 기록을 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    game.substitutions.splice(idx, 1);
    await game.save();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
