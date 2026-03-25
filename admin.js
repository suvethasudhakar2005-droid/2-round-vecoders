const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Team = require('../models/Team');
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');

// GET /api/problem — get THIS team's problem (no answer sent)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const problem = await Problem.findOne({ id: req.team.problemId }).select('-answer -_id -__v');
    if (!problem) return res.status(404).json({ error: 'Problem not assigned' });
    res.json({ problem, teamName: req.team.teamName, completed: req.team.completed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load problem' });
  }
});

// POST /api/problem/submit
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event || !event.isStarted) return res.status(403).json({ error: 'Event has not started yet' });
    if (event.isEnded) return res.status(403).json({ error: 'Event has ended. Submissions closed.' });

    // Check timer
    const elapsed = Math.floor((Date.now() - event.startTime) / 1000);
    if (elapsed >= event.duration) return res.status(403).json({ error: 'Time is up! Submissions closed.' });

    if (req.team.completed) return res.status(400).json({ error: 'You have already unlocked the vault!' });

    const { answer } = req.body;
    if (!answer || typeof answer !== 'string') return res.status(400).json({ error: 'Answer is required' });

    req.team.submissionCount += 1;
    req.team.lastSubmitAt = new Date();
    await req.team.save();

    const problem = await Problem.findOne({ id: req.team.problemId });
    const correct = problem.answer.trim().toLowerCase() === answer.trim().toLowerCase();

    if (correct) {
      req.team.completed = true;
      req.team.completionTime = elapsed;
      await req.team.save();

      // Emit real-time update via socket
      const io = req.app.get('io');
      io.emit('vault_unlocked', { teamName: req.team.teamName, completionTime: elapsed });
      io.emit('scoreboard_update');

      return res.json({ success: true, message: '🔓 Vault Unlocked! King Rescued! 👑', correct: true });
    } else {
      return res.json({ success: false, message: '❌ Vault Locked – Try Again', correct: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

module.exports = router;
