const express = require('express');
const router = express.Router();
const { User, AdminLog } = require('../utils/db')
const { Op } = require('sequelize');
const { logAdminAction } = require('../utils/admin-logs');

router.get('/logs', async (req, res) => {
  const { date, room, username } = req.query;
  const where = {};

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.timestamp = { [Op.between]: [start, end] };
  }

  if (room) {
    where.room = room;
  }

  if (username) {
    const user = await User.findOne({ where: { username } });

    if (user) {
      // Known user: filter by user_id only
      where.user_id = user.id;
    } else {
      // Guest or unknown user: filter by username AND user_id = 0
      where.user_id = 0;
      where.username = username;
    }
  }

  const logs = await AdminLog.findAll({
    where,
    order: [['timestamp', 'DESC']]
  });

  const result = logs.map(log => ({
    timestamp: log.timestamp,
    action: log.action,
    details: log.details,
    room: log.room,
    ip_address: log.ip_address,
    user_id: log.user_id,
    username: log.username
  }));

  res.json(result);
});


router.post('/log', async (req, res) => {
  const { username, action, details, room } = req.body;
  const ip_address = req.ip;
  let userID = null; 
  if (username !== undefined && username !== null && username.trim() !== '') {
        let user = await User.findOne({ where: { username } });
        if (user) {
            userID = user.id;
        } else {
            userID = 0 ;
        }
    }
  try {
    await logAdminAction({ user_id: userID, username, action, details, room, ip_address });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log admin action' });
  }
});

module.exports = { router };