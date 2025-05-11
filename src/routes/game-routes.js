const express = require('express');
const path = require('path')
const router = express.Router();
const generateCode = require('../utils/create-game-code');
const getRandomWordPair = require('../utils/get-word-pair');

const rooms = {}; // In-memory store for now

router.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/create-game.html'));
  });

router.post('/create-room', async (req, res) => {
  const code = generateCode();
  const wordPair = await getRandomWordPair();
  rooms[code] = {
    players: [],
    createdAt: new Date(),
    wordPair: wordPair
  };
  res.status(201).json({ code, wordPair });
});

router.post('/join-room', (req, res) => {
  const { code, username } = req.body;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }

  rooms[code].players.push({ username });
  res.status(200).json({ message: 'Joined room', players: rooms[code].players });
});

module.exports = { router, rooms };