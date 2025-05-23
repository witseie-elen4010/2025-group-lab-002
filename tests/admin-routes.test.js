const request = require('supertest');
const express = require('express');
const { router } = require('../src/routes/admin-routes.js'); // adjust path if needed
const { User, AdminLog } = require('../src/utils/db.js');
const { logAdminAction } = require('../src/utils/admin-logs.js');

jest.mock('../src/utils/db.js');
jest.mock('../src/utils/admin-logs.js');

const app = express();
app.use(express.json());
app.use('/admin', router);

describe('admin-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /admin/log', () => {
    it('should log an admin action if username exists', async () => {
      User.findOne.mockResolvedValue({ id: 42 });
      logAdminAction.mockResolvedValue();

      const response = await request(app).post('/admin/log').send({
        username: 'admin',
        action: 'ban',
        details: 'Banned user',
        room: 'ROOM1'
      });

      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'admin' } });
      expect(logAdminAction).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 42,
        action: 'ban',
        details: 'Banned user',
        room: 'ROOM1',
        ip_address: expect.any(String)
      }));
      expect(response.body).toEqual({ success: true });
    });

    it('should return empty array if username not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post('/admin/log').send({
        username: 'ghost',
        action: 'fail'
      });

      expect(response.body).toEqual([]);
    });

    it('should return 500 on logging failure', async () => {
      User.findOne.mockResolvedValue({ id: 42 });
      logAdminAction.mockRejectedValue(new Error('DB fail'));

      const response = await request(app).post('/admin/log').send({
        username: 'admin',
        action: 'oops'
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to log admin action' });
    });
  });

  describe('GET /admin/logs', () => {
    it('should return filtered logs by username', async () => {
      User.findOne.mockResolvedValue({ id: 42 });
      AdminLog.findAll.mockResolvedValue([
        { timestamp: new Date(), action: 'test', User: { username: 'admin' } }
      ]);

      const response = await request(app).get('/admin/logs').query({ username: 'admin' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('action', 'test');
    });

    it('should return empty array if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).get('/admin/logs').query({ username: 'ghost' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});