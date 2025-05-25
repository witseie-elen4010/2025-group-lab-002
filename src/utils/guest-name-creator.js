const fs = require('fs');
const path = require('path');

const existingGuestNames = new Set();
const usernameExpiry = new Map(); // name -> timeoutId

// Load and cache the word lists once on module load
const adjectives = fs.readFileSync(path.join(__dirname, '../../data/adjectives.txt'), 'utf8')
  .split('\n')
  .map(word => word.trim())
  .filter(Boolean);

const nouns = fs.readFileSync(path.join(__dirname, '../../data/nouns.txt'), 'utf8')
  .split('\n')
  .map(word => word.trim())
  .filter(Boolean);

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateGuestName({separator = '' } = {}) {
  const adjective = getRandomElement(adjectives);
  const noun = getRandomElement(nouns);
  return `${adjective}${separator}${noun}`;
}


function reserveGuestName(name, expiryMs = 30 * 60 * 1000) {
  existingGuestNames.add(name);
  const timeoutId = setTimeout(() => {
    existingGuestNames.delete(name);
    usernameExpiry.delete(name);
  }, expiryMs);
  usernameExpiry.set(name, timeoutId);
}


module.exports = { generateGuestName, reserveGuestName, existingGuestNames };