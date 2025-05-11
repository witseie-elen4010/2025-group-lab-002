const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/utils/db');

describe('User Auth API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset DB for test
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/users/signup', () => {
    it('should create a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('testuser@example.com');
    });

    it('should not allow duplicate usernames or emails', async () => {
      await request(app)
        .post('/api/users/signup')
        .send({
          username: 'dupeuser',
          email: 'dupe@example.com',
          password: 'Test@1234'
        });
      const res = await request(app)
        .post('/api/users/signup')
        .send({
          username: 'dupeuser',
          email: 'dupe@example.com',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/User already exists/);
    });
  });

  describe('POST /api/users/login', () => {
    beforeAll(async () => {
      // Ensure user exists for login
      await User.create({
        username: 'loginuser',
        email: 'loginuser@example.com',
        password: await require('bcrypt').hash('Login@1234', 10)
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'loginuser',
          password: 'Login@1234'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe('loginuser');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'loginuser',
          password: 'WrongPassword1!'
        });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/Invalid credentials/);
    });

    it('should not login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          username: 'nouser',
          password: 'DoesntMatter1!'
        });
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/User not found/);
    });
  });
});
