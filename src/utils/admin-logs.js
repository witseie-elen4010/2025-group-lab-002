const { AdminLog } = require('./db');

/**
 * Logs an admin action
 * @param {Object} params - The logging parameters
 * @param {number} params.user_id - ID of the admin performing the action
 * @param {string} params.action - The action being performed
 * @param {string} [params.details] - Optional details about the action
 * @param {string} [params.room] - Optional room code
 * @param {string} [params.ip_address] - Optional IP address
 */
async function logAdminAction({ user_id, action, details, room, ip_address }) {
  try {
    await AdminLog.create({
      user_id,
      action,
      details,
      room,
      ip_address,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}

module.exports = { logAdminAction };