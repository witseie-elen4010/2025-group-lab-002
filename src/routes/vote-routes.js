const express = require('express');
const router = express.Router();
const { Vote } = require('../utils/db');

// POST /api/votes - Record a vote
router.post('/', async (req, res) => {
  try {
    const { player_id, voted_for_id, round_number } = req.body;
    if (!player_id || !voted_for_id || !round_number) {
      return res.status(400).json({ message: 'Missing required vote fields.' });
    }
    const vote = await Vote.create({ player_id, voted_for_id, round_number });
    res.status(201).json({ message: 'Vote recorded successfully', vote });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ message: 'Error recording vote', error: error.message });
  }
});

module.exports = router;
