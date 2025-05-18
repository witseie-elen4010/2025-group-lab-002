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
  const data = req.body; 
  rooms[code] = {
    players: [],
    createdAt: new Date(),
    wordPair: wordPair,
    clues : [],
    currentPlayerIndex:0, 
    chat : []
  };
  res.status(201).json({ code, rooms });
});

router.post('/join-room', (req, res) => {
  const { code, username } = req.body;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  const playerID = rooms[code].players.length ;


  rooms[code].players.push({ username, playerID });
  res.status(200).json({ message: 'Joined room', players: rooms[code].players, code: code });
});

router.get('/play', (req, res) => {
  const { code } = req.query;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.sendFile(path.join(__dirname, '../public/play.html'));
});

router.get('/get-room', (req, res) => {
  const { code } = req.query;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.status(200).json({ message: 'Room found', room: rooms[code] });
});

router.get('/lobby', (req, res) => {
  const { code } = req.query;
  console.log(`code: ${code}`);
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.sendFile(path.join(__dirname, '../public/lobby.html'));
});


router.get('/get-chat', (req,res) => {
  const { code } = req.query;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.status(200).json({chat: rooms[code].chat});
  
  
router.get('/players', (req, res) => {
  const code = req.query.code;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.status(200).json(rooms[code].players);
});

router.get('/voting-round', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/voting-round.html'));
});

module.exports = { router, rooms };