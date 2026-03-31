const express = require('express');
const router = express.Router();
const League = require('../models/League');
const nextId = require('../utils/nextId');

// GET /api/leagues
router.get('/', async (req, res, next) => {
  try {
    const leagues = await League.find();
    res.json({ success: true, data: leagues });
  } catch (err) {
    next(err);
  }
});

// GET /api/leagues/:id
router.get('/:id', async (req, res, next) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '리그를 찾을 수 없습니다' } });
    res.json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
});

// POST /api/leagues
router.post('/', async (req, res, next) => {
  try {
    const { name, season, format, rounds, organizer, description, startDate, endDate } = req.body;
    if (!name || !season) return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'name, season 필드가 필요합니다' } });

    const id = await nextId(League, 'league');
    const league = new League({
      _id: id,
      name: String(name),
      season: String(season),
      format: format === 'tournament' ? 'tournament' : 'league',
      rounds: Array.isArray(rounds) ? rounds.map(String) : [],
      organizer: organizer ? String(organizer) : '',
      description: description ? String(description) : '',
      startDate: startDate || '',
      endDate: endDate || '',
    });
    await league.save();
    res.status(201).json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
});

// PUT /api/leagues/:id
router.put('/:id', async (req, res, next) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '리그를 찾을 수 없습니다' } });

    const { name, season, format, rounds, organizer, description, startDate, endDate } = req.body;
    if (name !== undefined) league.name = String(name);
    if (season !== undefined) league.season = String(season);
    if (format !== undefined) league.format = format === 'tournament' ? 'tournament' : 'league';
    if (rounds !== undefined) league.rounds = Array.isArray(rounds) ? rounds.map(String) : [];
    if (organizer !== undefined) league.organizer = String(organizer);
    if (description !== undefined) league.description = String(description);
    if (startDate !== undefined) league.startDate = startDate;
    if (endDate !== undefined) league.endDate = endDate;

    await league.save();
    res.json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/leagues/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const league = await League.findById(req.params.id);
    if (!league) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '리그를 찾을 수 없습니다' } });
    await league.deleteOne();
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
