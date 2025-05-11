const { sequelize, WordPair } = require('./db');

async function seedWordPairs() {
  try {
    await sequelize.sync(); // Ensure tables exist

    await WordPair.bulkCreate([
      { civilian_word: 'apple', undercover_word: 'pear' },
      { civilian_word: 'cat', undercover_word: 'tiger' },
      { civilian_word: 'car', undercover_word: 'truck' },
      { civilian_word: 'doctor', undercover_word: 'nurse' },
      { civilian_word: 'ocean', undercover_word: 'lake' }
    ]);

    console.log('Word pairs seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding word pairs:', error);
    process.exit(1);
  }
}

async function getRandomWordPair() {
  try {
    const count = await WordPair.count();
    const randomOffset = Math.floor(Math.random() * count);
    const randomPair = await WordPair.findOne({ offset: randomOffset });
    return randomPair;
  } catch (error) {
    console.error('Error fetching random word pair:', error);
    throw error;
  }
}

module.exports = {
  seedWordPairs,
  getRandomWordPair
};

seedWordPairs();