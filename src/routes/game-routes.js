const express = require('express');
const path = require('path')
const router = express.Router();
const generateCode = require('../utils/create-game-code');

const rooms = {}; // In-memory store for now

router.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/join-game.html'));
  });

router.post('/create-room', (req, res) => {
  const code = generateCode();
  rooms[code] = {
    players: [],
    createdAt: new Date()
  };
  res.status(201).json({ code });
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