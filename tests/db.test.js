// Move this inside the jest.mock factory!
jest.mock('../src/config/database', () => {
  const MockSequelize = require('sequelize-mock');
  return new MockSequelize();
});

const db = require('../src/utils/db');

describe('db.js', () => {
  describe('testConnection', () => {
    it('should simulate successful database connection', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await db.testConnection();
      expect(logSpy).toHaveBeenCalledWith('Database connection has been established successfully.');
      logSpy.mockRestore();
    });
  });

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      db.User.findByPk = jest.fn().mockResolvedValue({ id: 1, username: 'alice' });
      const user = await db.findUserById(1);
      expect(user).toEqual({ id: 1, username: 'alice' });
    });

    it('should throw error if DB fails', async () => {
      db.User.findByPk = jest.fn().mockRejectedValue(new Error('DB Error'));
      await expect(db.findUserById(1)).rejects.toThrow('DB Error');
    });
  });

  describe('findUserByUsername', () => {
    it('should return user with matching username', async () => {
      db.User.findOne = jest.fn().mockResolvedValue({ id: 2, username: 'bob' });
      const user = await db.findUserByUsername('bob');
      expect(user.username).toBe('bob');
    });

    it('should handle DB error', async () => {
      db.User.findOne = jest.fn().mockRejectedValue(new Error('DB fail'));
      await expect(db.findUserByUsername('bob')).rejects.toThrow('DB fail');
    });
  });

  describe('findUserByEmail', () => {
    it('should return user with matching email', async () => {
      db.User.findOne = jest.fn().mockResolvedValue({ id: 3, email: 'test@example.com' });
      const user = await db.findUserByEmail('test@example.com');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('findLogsBetweenTimestamps', () => {
    it('should return logs in time range', async () => {
      const start = new Date(Date.now() - 10000);
      const end = new Date();
      db.AdminLog.findAll = jest.fn().mockResolvedValue([
        { id: 1, timestamp: start },
        { id: 2, timestamp: end }
      ]);
      const logs = await db.findLogsBetweenTimestamps(start, end);
      expect(logs.length).toBe(2);
    });
  });

  describe('findLogsForRoom', () => {
    it('should return logs for specified room', async () => {
      db.AdminLog.findAll = jest.fn().mockResolvedValue([
        { id: 1, room: 'Lobby' }
      ]);
      const logs = await db.findLogsForRoom('Lobby');
      expect(logs[0].room).toBe('Lobby');
    });
  });

  describe('findLogsByUserId', () => {
    it('should return logs for specific user', async () => {
      db.AdminLog.findAll = jest.fn().mockResolvedValue([
        { id: 1, user_id: 42 },
        { id: 2, user_id: 42 }
      ]);
      const logs = await db.findLogsByUserId(42);
      expect(logs.every(l => l.user_id === 42)).toBe(true);
    });
  });
});
