const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Team = require('../models/Team');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { teamName } = req.body;
    if (!teamName || typeof teamName !== 'string') {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const cleanName = teamName.trim();
    const team = await Team.findOne({ teamName: { $regex: new RegExp(`^${cleanName}$`, 'i') } });

    if (!team) return res.status(404).json({ error: 'Team not found. Check your team name.' });
    if (team.isActive) return res.status(409).json({ error: 'This team is already logged in from another device.' });

    const token = uuidv4();
    team.isActive = true;
    team.sessionToken = token;
    await team.save();

    res.json({ success: true, token, teamName: team.teamName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    req.team.isActive = false;
    req.team.sessionToken = null;
    await req.team.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
