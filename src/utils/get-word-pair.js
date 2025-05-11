const { WordPair } = require('./db');

async function getRandomWordPair() {
  try {
    const count = await WordPair.count();
    const randomOffset = Math.floor(Math.random() * count);
    return await WordPair.findOne({ offset: randomOffset });
  } catch (error) {
    console.error('Error fetching word pair:', error);
    throw error;
  }
}

module.exports = getRandomWordPair;