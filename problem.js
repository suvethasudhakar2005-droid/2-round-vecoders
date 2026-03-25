const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

app.set('io', io);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Rate limiter
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/problem', require('./routes/problem'));
app.use('/api/scoreboard', require('./routes/scoreboard'));
app.use('/api/admin', require('./routes/admin'));

// Event state route (public - for timer sync)
const Event = require('./models/Event');
app.get('/api/event/status', async (req, res) => {
  const event = await Event.findOne();
  if (!event) return res.json({ isStarted: false, isEnded: false });
  const now = Date.now();
  const elapsed = event.isStarted && event.startTime ? Math.floor((now - new Date(event.startTime)) / 1000) : 0;
  const remaining = Math.max(0, event.duration - elapsed);
  res.json({ isStarted: event.isStarted, isEnded: event.isEnded, remaining, duration: event.duration, startTime: event.startTime });
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current event state on connect
  Event.findOne().then(event => {
    if (event && event.isStarted && !event.isEnded) {
      const elapsed = Math.floor((Date.now() - new Date(event.startTime)) / 1000);
      const remaining = Math.max(0, event.duration - elapsed);
      socket.emit('event_started', { startTime: event.startTime, duration: event.duration, remaining });
    } else if (event && event.isEnded) {
      socket.emit('event_ended');
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Timer broadcast loop
setInterval(async () => {
  try {
    const event = await Event.findOne();
    if (event && event.isStarted && !event.isEnded) {
      const elapsed = Math.floor((Date.now() - new Date(event.startTime)) / 1000);
      const remaining = Math.max(0, event.duration - elapsed);
      io.emit('timer_tick', { remaining });
      if (remaining <= 0) {
        event.isEnded = true;
        event.endTime = new Date();
        await event.save();
        io.emit('event_ended');
      }
    }
  } catch (e) {}
}, 1000);

// MongoDB + Start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });
