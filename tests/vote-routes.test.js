const request = require('supertest');
const app = require('../src/app');
const { sequelize, Vote } = require('../src/utils/db');
jest.setTimeout(15000);

describe('Vote API', () => {
  beforeAll(async () => {
    // First drop all tables with cascade
    await sequelize.drop({ cascade: true }).catch(err => {
      console.log('Drop error:', err);
      // Continue even if drop fails - sync will recreate tables
    });
    
    // Then recreate all tables
    await sequelize.sync({force:true}).catch(err => {
      console.log('Sync error:', err);
      throw err; // If sync fails, we should stop the tests
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should add a vote to the database when a vote is submitted', async () => {
    // Arrange: valid vote data
    const voteData = {
      player_id: 1,
      voted_for_id: 2,
      round_number: 1,
      game_id: 1
    };

    // Act: submit vote
    const res = await request(app)
      .post('/api/votes')
      .send(voteData);

    // Assert: response and DB
    expect(res.statusCode).toBe(201);
    expect(res.body.vote).toMatchObject(voteData);

    // Check DB
    const dbVote = await Vote.findOne({ where: voteData });
    expect(dbVote).not.toBeNull();
    expect(dbVote.player_id).toBe(voteData.player_id);
    expect(dbVote.voted_for_id).toBe(voteData.voted_for_id);
    expect(dbVote.round_number).toBe(voteData.round_number);
    expect(dbVote.game_id).toBe(voteData.game_id);
  });

  it('should not add a vote if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/votes')
      .send({ player_id: 1, voted_for_id: 2 }); // missing round_number, game_id
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Missing required vote fields/);
  });
});