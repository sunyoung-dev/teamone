const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const nextId = require('../utils/nextId');

const VALID_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const VALID_BAT_HANDS = ['L', 'R', 'S'];
const VALID_THROW_HANDS = ['L', 'R'];

// GET /api/players
router.get('/', async (req, res, next) => {
  try {
    const players = await Player.find();
    res.json({ success: true, data: players });
  } catch (err) {
    next(err);
  }
});

// GET /api/players/:id
router.get('/:id', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: { code: 'PLAYER_NOT_FOUND', message: '선수를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    res.json({ success: true, data: player });
  } catch (err) {
    next(err);
  }
});

// POST /api/players
router.post('/', async (req, res, next) => {
  try {
    const { name, number, position, battingHand, throwingHand, active } = req.body;

    if (!name || number === undefined || !position || !battingHand || !throwingHand) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'name, number, position, battingHand, throwingHand 필드가 필요합니다' },
      });
    }
    if (!VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `position은 ${VALID_POSITIONS.join(', ')} 중 하나여야 합니다` },
      });
    }
    if (!VALID_BAT_HANDS.includes(battingHand)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'battingHand는 L, R, S 중 하나여야 합니다' },
      });
    }
    if (!VALID_THROW_HANDS.includes(throwingHand)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'throwingHand는 L, R 중 하나여야 합니다' },
      });
    }

    const duplicate = await Player.findOne({ active: true, number: Number(number) });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_NUMBER', message: `등번호 ${number}는 이미 사용 중입니다` },
      });
    }

    const id = await nextId(Player, 'p');
    const player = new Player({
      _id: id,
      name: String(name),
      number: Number(number),
      position,
      battingHand,
      throwingHand,
      active: active !== undefined ? Boolean(active) : true,
    });
    await player.save();

    res.status(201).json({ success: true, data: player });
  } catch (err) {
    next(err);
  }
});

// PUT /api/players/:id
router.put('/:id', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: { code: 'PLAYER_NOT_FOUND', message: '선수를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }

    const { name, number, position, battingHand, throwingHand, active } = req.body;

    if (position && !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: `position은 ${VALID_POSITIONS.join(', ')} 중 하나여야 합니다` },
      });
    }
    if (battingHand && !VALID_BAT_HANDS.includes(battingHand)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'battingHand는 L, R, S 중 하나여야 합니다' },
      });
    }
    if (throwingHand && !VALID_THROW_HANDS.includes(throwingHand)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'throwingHand는 L, R 중 하나여야 합니다' },
      });
    }

    if (number !== undefined) {
      const duplicate = await Player.findOne({ active: true, number: Number(number), _id: { $ne: req.params.id } });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: { code: 'DUPLICATE_NUMBER', message: `등번호 ${number}는 이미 사용 중입니다` },
        });
      }
    }

    if (name !== undefined) player.name = String(name);
    if (number !== undefined) player.number = Number(number);
    if (position !== undefined) player.position = position;
    if (battingHand !== undefined) player.battingHand = battingHand;
    if (throwingHand !== undefined) player.throwingHand = throwingHand;
    if (active !== undefined) player.active = Boolean(active);

    await player.save();
    res.json({ success: true, data: player });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/players/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({
        success: false,
        error: { code: 'PLAYER_NOT_FOUND', message: '선수를 찾을 수 없습니다', details: { id: req.params.id } },
      });
    }
    player.active = false;
    await player.save();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
