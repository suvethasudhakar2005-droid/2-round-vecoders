const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Problem = require('../models/Problem');
const Event = require('../models/Event');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/admin/teams
router.get('/teams', adminMiddleware, async (req, res) => {
  const teams = await Team.find({}).select('-sessionToken -__v');
  res.json({ teams });
});

// POST /api/admin/teams — add team
router.post('/teams', adminMiddleware, async (req, res) => {
  try {
    const { teamName, problemId } = req.body;
    if (!teamName || !problemId) return res.status(400).json({ error: 'teamName and problemId required' });
    const team = new Team({ teamName: teamName.trim(), problemId });
    await team.save();
    res.json({ success: true, team });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Team name already exists' });
    res.status(500).json({ error: 'Failed to add team' });
  }
});

// PUT /api/admin/teams/:id — edit team
router.put('/teams/:id', adminMiddleware, async (req, res) => {
  try {
    const { teamName, problemId } = req.body;
    const update = {};
    if (teamName) update.teamName = teamName.trim();
    if (problemId) update.problemId = problemId;
    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE /api/admin/teams/:id
router.delete('/teams/:id', adminMiddleware, async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// POST /api/admin/teams/:id/kick — force logout a team
router.post('/teams/:id/kick', adminMiddleware, async (req, res) => {
  try {
    await Team.findByIdAndUpdate(req.params.id, { isActive: false, sessionToken: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to kick team' });
  }
});

// GET /api/admin/problems
router.get('/problems', adminMiddleware, async (req, res) => {
  const problems = await Problem.find({}).select('-__v');
  res.json({ problems });
});

// POST /api/admin/event/start
router.post('/event/start', adminMiddleware, async (req, res) => {
  try {
    let event = await Event.findOne();
    if (!event) event = new Event();
    if (event.isStarted && !event.isEnded) return res.status(400).json({ error: 'Event already running' });

    event.isStarted = true;
    event.isEnded = false;
    event.startTime = new Date();
    event.endTime = null;
    await event.save();

    // Reset all teams
    await Team.updateMany({}, { completed: false, completionTime: null, submissionCount: 0 });

    const io = req.app.get('io');
    io.emit('event_started', { startTime: event.startTime, duration: event.duration });

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start event' });
  }
});

// POST /api/admin/event/end
router.post('/event/end', adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event || !event.isStarted) return res.status(400).json({ error: 'No active event' });

    event.isEnded = true;
    event.endTime = new Date();
    await event.save();

    const io = req.app.get('io');
    io.emit('event_ended');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end event' });
  }
});

// GET /api/admin/event
router.get('/event', adminMiddleware, async (req, res) => {
  const event = await Event.findOne();
  res.json({ event });
});

// POST /api/admin/reset — full reset
router.post('/reset', adminMiddleware, async (req, res) => {
  try {
    await Team.updateMany({}, { completed: false, completionTime: null, submissionCount: 0, isActive: false, sessionToken: null });
    await Event.updateMany({}, { isStarted: false, isEnded: false, startTime: null, endTime: null });
    const io = req.app.get('io');
    io.emit('event_reset');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

module.exports = router;
