const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Event = require('../models/Event');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/scoreboard — participants see only after event ends
router.get('/', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event || (!event.isEnded)) {
      return res.status(403).json({ error: 'Scoreboard is visible only after the event ends.' });
    }
    const scores = await buildScoreboard();
    res.json({ scores, event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load scoreboard' });
  }
});

// GET /api/scoreboard/admin — always visible to admin
router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const scores = await buildScoreboard();
    const event = await Event.findOne();
    res.json({ scores, event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load scoreboard' });
  }
});

async function buildScoreboard() {
  const teams = await Team.find({}).select('-sessionToken -__v');
  const sorted = teams.sort((a, b) => {
    if (a.completed && b.completed) return a.completionTime - b.completionTime;
    if (a.completed) return -1;
    if (b.completed) return 1;
    return 0;
  });
  return sorted.map((t, i) => ({
    rank: t.completed ? i + 1 : null,
    teamName: t.teamName,
    completed: t.completed,
    completionTime: t.completed ? formatTime(t.completionTime) : null,
    completionSeconds: t.completionTime,
    submissionCount: t.submissionCount,
    isActive: t.isActive
  }));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

module.exports = router;
