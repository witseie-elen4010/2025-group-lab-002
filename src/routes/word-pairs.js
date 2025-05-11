const express = require('express');
const router = express.Router();
const { getRandomWordPair } = require('../utils/seed-word-pairs');

router.get('/random-word-pair-json', async (req, res) => {
    try {
      const pair = await getRandomWordPair();
      res.json(pair);
    } catch (err) {
      res.status(500).json({ error: 'Error getting word pair' });
    }
  });

module.exports = router;