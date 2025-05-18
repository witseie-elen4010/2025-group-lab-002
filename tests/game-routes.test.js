// game-routes.test.js
const request = require('supertest');
const app = require('../src/app');
const { rooms } = require('../src/routes/game-routes');

jest.mock('../src/utils/create-game-code', () => jest.fn(() => 'ABCDE'));
jest.mock('../src/utils/get-word-pair', () => jest.fn(() => Promise.resolve({
  civilian_word: 'apple',
  undercover_word: 'pear',
})));

describe('Game Routes', () => {
  afterEach(() => {
    // Clean up rooms between tests
    for (let key in rooms) {
      delete rooms[key];
    }
  });

  test('POST /api/game/create-room should create a new room', async () => {
    const res = await request(app).post('/api/game/create-room'); // updated route

    expect(res.status).toBe(201);
    expect(res.body.code).toBe('ABCDE');
    expect(res.body.rooms['ABCDE'].wordPair).toEqual({ civilian_word: 'apple', undercover_word: 'pear' });
    expect(rooms['ABCDE']).toBeDefined();
  });

  test('POST /api/game/join-room should join an existing room', async () => { // updated route
    rooms['ABCDE'] = {
      players: [],
      createdAt: new Date(),
      wordPair: { civilian_word: 'apple', undercover_word: 'pear' }
    };

    const res = await request(app)
      .post('/api/game/join-room')  // updated route
      .send({ code: 'ABCDE', username: 'test-player' });

    expect(res.status).toBe(200);
    expect(res.body.players).toEqual([{ username: 'test-player', playerID: 0 }]);
  });

  test('POST /api/game/join-room should return 404 for non-existent room', async () => { // updated route
    const res = await request(app)
      .post('/api/game/join-room')  // updated route
      .send({ code: 'ZZZZZ', username: 'ghost' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Room not found');
  });
});