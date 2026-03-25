# 🔒 Vault Break Challenge — Chess Tech Event System

A secure, real-time competitive platform where 20 teams solve unique chess-based programming problems to unlock their vault.

---

## 📁 Project Structure

```
vault-break/
├── backend/           ← Node.js + Express + MongoDB
│   ├── models/        ← Team, Problem, Event schemas
│   ├── routes/        ← auth, problem, scoreboard, admin
│   ├── middleware/    ← auth + admin guards
│   ├── server.js      ← Main server + Socket.IO
│   ├── seed.js        ← Seeds teams & problems into DB
│   └── .env           ← Config (edit if needed)
├── frontend/          ← React app
│   ├── src/
│   │   ├── pages/     ← LoginPage, GamePage, OrganizerPage
│   │   ├── components/← Timer
│   │   ├── context/   ← SocketContext
│   │   ├── api.js     ← Axios instance
│   │   └── App.js
│   └── public/
└── README.md
```

---

## ✅ PREREQUISITES

Install these before running:

1. **Node.js** (v18+) → https://nodejs.org
2. **MongoDB Community** → https://www.mongodb.com/try/download/community
   - Start MongoDB: Run `mongod` or start MongoDB service
3. **VS Code** → https://code.visualstudio.com

---

## 🚀 SETUP & RUN (Step by Step)

### Step 1 — Open project in VS Code
```
File → Open Folder → select the "vault-break" folder
```

### Step 2 — Open TWO terminals in VS Code
`Terminal → New Terminal` (do this twice)

---

### Terminal 1 — Backend Setup

```bash
cd backend
npm install
node seed.js       ← Seeds 20 problems + 20 teams into MongoDB
npm run dev        ← Starts backend on http://localhost:5000
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

---

### Terminal 2 — Frontend Setup

```bash
cd frontend
npm install
npm start          ← Opens http://localhost:3000
```

---

## 🌐 URLS

| Page | URL |
|------|-----|
| Team Login | http://localhost:3000 |
| Organizer Panel | http://localhost:3000/organizer |

---

## 🔑 ADMIN ACCESS

Go to: **http://localhost:3000/organizer**

Admin Key (enter when prompted):
```
organizer_secret_route_chess2024
```

---

## 👥 TEAM NAMES (20 Teams)

These are the valid team names seeded into the database:

| Team Name | Problem |
|-----------|---------|
| AlphaKnights | Knight Shortest Path (BFS) |
| BishopBrains | Rook Traversal |
| CastleCoders | Bishop Diagonal Logic |
| DiagonalDuo | Knight Tour |
| EightQueens | Queen Coverage |
| FortressTeam | King Safety Detection |
| GrandMasters | Pawn Logic |
| HexagonHackers | Grid Obstacles |
| IronRooks | Parity Logic |
| JadeKings | Graph Reachability |
| KnightRiders | N-Queens |
| LogicLancers | Check Detection |
| MatrixMates | Encoding Problems |
| NullPointers | Path Encryption |
| ObsidianOwls | Multi-piece Mapping |
| PawnPushers | Decision Tree |
| QueenSlayers | Pattern Generation |
| RookRunners | Final Vault |
| SilverBishops | Queen Coverage (corner) |
| TurboKnights | Knight: Center to Corner |

---

## 🎮 EVENT FLOW

1. Teams open **http://localhost:3000** and type their team name
2. Organizer opens **http://localhost:3000/organizer** and logs in
3. Organizer clicks **▶ Start Event** — timer begins for all teams simultaneously
4. Teams solve their chess problem and submit answers
5. Correct answer → 🔓 Vault Unlocked!
6. Organizer can view live scoreboard at any time
7. After 10 minutes (or manual end), event ends
8. Scoreboard becomes visible to ALL participants

---

## 🔐 SECURITY FEATURES

- ✅ Team session tokens (UUID) — one per team
- ✅ Duplicate login prevention — same team can't log in twice
- ✅ All answer validation done server-side only
- ✅ Answers NEVER sent to frontend
- ✅ Admin routes protected by secret key header
- ✅ Auth middleware on all protected routes
- ✅ Rate limiting (60 requests/min per IP)
- ✅ Helmet.js security headers

---

## 🛠 CUSTOMIZATION

### Change event duration
Edit `backend/.env` or in seed.js Event default (`duration: 600` = 10 minutes)

### Add/Edit team names
Use the Organizer Panel → Teams tab

### Change admin key
Edit `backend/.env` → `ADMIN_SECRET`
Also update the same value in `frontend/src/pages/OrganizerPage.js` → `const ADMIN_KEY = '...'`

### Change MongoDB URL
Edit `backend/.env` → `MONGODB_URI`

---

## 📡 API REFERENCE

### Team Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/login | None | Login with team name |
| POST | /api/auth/logout | Team | Logout |

### Problem
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/problem | Team | Get assigned problem |
| POST | /api/problem/submit | Team | Submit answer |

### Scoreboard
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/scoreboard | Team | View scores (after event ends) |
| GET | /api/scoreboard/admin | Admin | View scores anytime |

### Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/admin/teams | Admin | List all teams |
| POST | /api/admin/teams | Admin | Add team |
| PUT | /api/admin/teams/:id | Admin | Edit team |
| DELETE | /api/admin/teams/:id | Admin | Delete team |
| POST | /api/admin/teams/:id/kick | Admin | Force logout team |
| POST | /api/admin/event/start | Admin | Start event |
| POST | /api/admin/event/end | Admin | End event |
| POST | /api/admin/reset | Admin | Full reset |

---

## ⚡ SOCKET.IO EVENTS

| Event | Direction | Description |
|-------|-----------|-------------|
| timer_tick | Server→Client | Every second with `{remaining}` |
| event_started | Server→Client | When organizer starts |
| event_ended | Server→Client | When time runs out or organizer ends |
| vault_unlocked | Server→Client | When a team solves their problem |
| scoreboard_update | Server→Client | Scoreboard changed |
| event_reset | Server→Client | Full reset triggered |

---

## 🐛 TROUBLESHOOTING

**MongoDB not connecting?**
- Make sure MongoDB is running: `mongod` in a separate terminal
- Or start MongoDB service on Windows: Services → MongoDB

**Port already in use?**
- Backend: Change `PORT=5000` in `.env`
- Frontend: React will auto-suggest another port

**Team says "already logged in"?**
- Use Admin Panel → Teams → Kick the team, then they can re-login

**Seed failed?**
- Make sure MongoDB is running BEFORE running `node seed.js`
- If re-seeding, it automatically clears old data first

---

## 🏆 ANSWER KEY (For Organizer Reference)

| Problem | Answer |
|---------|--------|
| Knight Shortest Path (a1→h8) | 6 |
| Rook 4 Corners | 4 |
| Bishop Reachability d4 | 20 |
| Knight First Moves from a1 | 2 |
| Queen Attack Squares d4 | 27 |
| King in Check (e1, Rook e8) | YES |
| Pawn Promotion Moves | 5 |
| Knight with Blocked Squares | 6 |
| Dark Squares Count | 32 |
| Knight Reach in 3 Moves | 22 |
| 4-Queens Solutions | 2 |
| Multiple Attackers | 2 |
| f6 Encoded | 45 |
| Knight Path Hash | 38 |
| Combined Piece Coverage | 27 |
| King Escape Options | 3 |
| Light Squares Sum | 32 |
| Final Vault | 6 |
| Queen Corner a1 | 21 |
| Knight e4→a1 | 3 |
