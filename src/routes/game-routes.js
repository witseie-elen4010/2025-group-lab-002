const express = require('express');
const path = require('path')
const router = express.Router();
const generateCode = require('../utils/create-game-code');
const getRandomWordPair = require('../utils/get-word-pair');
const { assignPlayerRolesAndOrder } = require('../utils/assign-roles-order');


const rooms = {}; // In-memory store for now

router.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/game/create-game.html'));
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
    chat : [],
    hasSubmittedClue: false,
    code: code,
    hasGameStarted: false,
    isGameFull: false
  };
  res.status(201).json({ code, rooms });
});

router.post('/join-room', (req, res) => {
  const { code, username } = req.body;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  if (rooms[code].hasGameStarted) {
    return res.status(400).json({ message: 'Game has already started' });
  }
  if (rooms[code].isGameFull) {
    return res.status(400).json({ message: 'Game is full' });
  }
  
  const playerID = rooms[code].players.length;
  if (rooms[code].players.length === 9) {
    rooms[code].isGameFull = true;
  }

  rooms[code].players.push({ username, playerID });
  res.status(200).json({ message: 'Joined room', players: rooms[code].players, code: code });
});

router.get('/play', (req, res) => {
  const { code } = req.query;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.sendFile(path.join(__dirname, '../public/game/play.html'));
});

router.get('/get-room', async (req, res) => {
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
  res.sendFile(path.join(__dirname, '../public/game/lobby.html'));
});


router.get('/get-chat', (req,res) => {
  const { code } = req.query;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }

  res.status(200).json({chat: rooms[code].chat});
});
  
router.get('/players', (req, res) => {
  const code = req.query.code;
  if (!rooms[code]) {
    return res.status(404).json({ message: 'Room not found' });
  }
  res.status(200).json(rooms[code].players);
});

router.get('/voting-round', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/game/voting-round.html'));
});

router.post('/assign-roles-order', (req, res) => {
  console.log('Assigning roles to players:', req.body);
  const { players } = req.body;
  console.log('Assigning roles to players:', players);
  const assigned = assignPlayerRolesAndOrder(players);
  console.log('Assigned roles:', assigned);
  res.status(200).json({ message: 'Roles assigned', players: assigned });
});

module.exports = { router, rooms };