const { logAdminAction } = require('../src/utils/admin-logs.js');
const { AdminLog } = require('../src/utils/db.js');

jest.mock('../src/utils/db', () => ({
  AdminLog: {
    create: jest.fn()
  }
}));

describe('logAdminAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call AdminLog.create with correct parameters', async () => {
    const params = {
      user_id: 1,
      action: 'delete-room',
      details: 'Room ABC123 deleted',
      room: 'ABC123',
      ip_address: '127.0.0.1'
    };

    await logAdminAction(params);

    expect(AdminLog.create).toHaveBeenCalledTimes(1);
    expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 1,
      action: 'delete-room',
      details: 'Room ABC123 deleted',
      room: 'ABC123',
      ip_address: '127.0.0.1',
      timestamp: expect.any(Date)
    }));
  });

  it('should not throw if AdminLog.create fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    AdminLog.create.mockRejectedValue(new Error('DB error'));

    const params = {
      user_id: 2,
      action: 'ban-user',
      details: 'User was banned for misconduct',
      room: 'XYZ789',
      ip_address: '192.168.1.1'
    };

    await expect(logAdminAction(params)).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log admin action:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should work with minimal required parameters', async () => {
    const params = {
      user_id: 3,
      action: 'login'
    };

    await logAdminAction(params);

    expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 3,
      action: 'login',
      details: undefined,
      room: undefined,
      ip_address: undefined,
      timestamp: expect.any(Date)
    }));
  });
});