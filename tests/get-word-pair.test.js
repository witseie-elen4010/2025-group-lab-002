const getRandomWordPair = require('../src/utils/get-word-pair');
const { WordPair } = require('../src/utils/db');

jest.mock('../src/utils/db', () => ({
  WordPair: {
    count: jest.fn(),
    findOne: jest.fn(),
  },
}));

describe('getRandomWordPair', () => {
  it('returns a word pair when data is available', async () => {
    WordPair.count.mockResolvedValue(5);
    WordPair.findOne.mockResolvedValue({
      civilian_word: 'apple',
      undercover_word: 'pear',
    });

    const pair = await getRandomWordPair();
    expect(pair).toEqual({
      civilian_word: 'apple',
      undercover_word: 'pear',
    });
    expect(WordPair.count).toHaveBeenCalled();
    expect(WordPair.findOne).toHaveBeenCalledWith(expect.objectContaining({ offset: expect.any(Number) }));
  });

  it('throws an error when count fails', async () => {
    WordPair.count.mockRejectedValue(new Error('DB error'));

    await expect(getRandomWordPair()).rejects.toThrow('DB error');
  });

  it('throws an error when findOne fails', async () => {
    WordPair.count.mockResolvedValue(5);
    WordPair.findOne.mockRejectedValue(new Error('Find failed'));

    await expect(getRandomWordPair()).rejects.toThrow('Find failed');
  });
});