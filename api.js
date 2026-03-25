import React, { useEffect, useState, useRef } from 'react';
import API from '../api';
import Timer from '../components/Timer';
import { io } from 'socket.io-client';

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg,#0d0d0d,#1a1a2e)', padding: '24px 16px' },
  container: { maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  logo: { fontFamily: 'Cinzel,serif', fontSize: '22px', color: '#f0c040', letterSpacing: '2px' },
  teamBadge: { background: '#0f3460', border: '1px solid #f0c04044', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: '#f0c040' },
  logoutBtn: { background: 'transparent', border: '1px solid #444', borderRadius: '6px', padding: '6px 14px', color: '#888', cursor: 'pointer', fontSize: '12px' },
  card: { background: '#16213e', border: '1px solid #2a2a4a', borderRadius: '14px', padding: '28px', marginBottom: '20px' },
  problemTitle: { fontFamily: 'Cinzel,serif', fontSize: '22px', color: '#f0c040', marginBottom: '6px' },
  categoryBadge: { display: 'inline-block', background: '#0f3460', border: '1px solid #f0c04044', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', color: '#f0c04099', marginBottom: '16px', letterSpacing: '1px' },
  sectionLabel: { fontSize: '11px', color: '#f0c04099', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 },
  desc: { color: '#ccc', lineHeight: 1.7, fontSize: '15px', marginBottom: '20px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  infoBox: { background: '#0d0d0d', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '14px' },
  code: { fontFamily: 'monospace', background: '#0d0d0d', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '14px', color: '#f0c040', fontSize: '14px' },
  vaultLocked: {
    textAlign: 'center', background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
    border: '2px solid #f0c04044', borderRadius: '14px', padding: '32px', marginBottom: '20px',
  },
  vaultUnlocked: {
    textAlign: 'center', background: 'linear-gradient(135deg,#003322,#00331a)',
    border: '2px solid #00ff8888', borderRadius: '14px', padding: '32px', marginBottom: '20px',
    boxShadow: '0 0 40px #00ff8822',
    animation: 'unlock-burst 0.6s ease',
  },
  vaultIcon: { fontSize: '64px', marginBottom: '12px' },
  vaultTitle: { fontFamily: 'Cinzel,serif', fontSize: '26px', fontWeight: 900, marginBottom: '8px' },
  inputRow: { display: 'flex', gap: '12px', marginTop: '20px' },
  answerInput: {
    flex: 1, background: '#0d0d0d', border: '1px solid #2a2a4a', borderRadius: '8px',
    padding: '14px 16px', color: '#f0e6d3', fontSize: '16px', outline: 'none', fontFamily: 'Inter,sans-serif',
  },
  submitBtn: {
    background: 'linear-gradient(135deg,#f0c040,#c49a28)', border: 'none', borderRadius: '8px',
    padding: '14px 28px', fontSize: '15px', fontWeight: 700, color: '#0d0d0d', cursor: 'pointer',
    fontFamily: 'Cinzel,serif', letterSpacing: '1px', whiteSpace: 'nowrap',
  },
  submitBtnDisabled: {
    background: '#333', border: 'none', borderRadius: '8px',
    padding: '14px 28px', fontSize: '15px', fontWeight: 700, color: '#666', cursor: 'not-allowed',
    fontFamily: 'Cinzel,serif', letterSpacing: '1px', whiteSpace: 'nowrap',
  },
  feedback: (correct) => ({
    marginTop: '16px', padding: '14px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '15px', fontWeight: 600,
    background: correct ? '#00ff8822' : '#ff444422',
    border: `1px solid ${correct ? '#00ff88' : '#ff4444'}`,
    color: correct ? '#00ff88' : '#ff8888',
  }),
  waiting: { textAlign: 'center', padding: '60px 20px', color: '#888' },
  waitIcon: { fontSize: '48px', marginBottom: '16px' },
  waitTitle: { fontFamily: 'Cinzel,serif', fontSize: '22px', color: '#f0c040', marginBottom: '10px' },
};

export default function GamePage({ teamName, onLogout }) {
  const [problem, setProblem] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [eventState, setEventState] = useState({ isStarted: false, isEnded: false, remaining: 600 });
  const [submissionCount, setSubmissionCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    loadProblem();
    fetchEventStatus();

    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('timer_tick', ({ remaining }) => {
      setEventState(prev => ({ ...prev, remaining }));
    });
    socket.on('event_started', ({ duration, remaining }) => {
      setEventState({ isStarted: true, isEnded: false, remaining: remaining || duration });
    });
    socket.on('event_ended', () => {
      setEventState(prev => ({ ...prev, isEnded: true, isStarted: true, remaining: 0 }));
    });
    socket.on('event_reset', () => {
      setEventState({ isStarted: false, isEnded: false, remaining: 600 });
      setCompleted(false); setFeedback(null);
    });

    return () => socket.disconnect();
  }, []);

  const loadProblem = async () => {
    try {
      const res = await API.get('/problem');
      setProblem(res.data.problem);
      setCompleted(res.data.completed);
    } catch (e) {
      if (e.response?.status === 401) { onLogout(); }
    }
  };

  const fetchEventStatus = async () => {
    try {
      const res = await API.get('/event/status');
      setEventState({ isStarted: res.data.isStarted, isEnded: res.data.isEnded, remaining: res.data.remaining || 600 });
    } catch (e) {}
  };

  const handleSubmit = async () => {
    if (!answer.trim() || submitting || completed) return;
    setSubmitting(true); setFeedback(null);
    try {
      const res = await API.post('/problem/submit', { answer });
      setSubmissionCount(c => c + 1);
      setFeedback({ correct: res.data.correct, message: res.data.message });
      if (res.data.correct) setCompleted(true);
    } catch (e) {
      setFeedback({ correct: false, message: e.response?.data?.error || 'Submission failed' });
    } finally { setSubmitting(false); }
  };

  const handleLogout = async () => {
    try { await API.post('/auth/logout'); } catch (e) {}
    localStorage.removeItem('vb_token'); localStorage.removeItem('vb_team');
    onLogout();
  };

  const locked = !eventState.isStarted || eventState.isEnded || (eventState.remaining <= 0);

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>♚ Vault Break</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={s.teamBadge}>⚔️ {teamName}</div>
            <button style={s.logoutBtn} onClick={handleLogout}>Exit</button>
          </div>
        </div>

        {/* Timer */}
        <div style={{ marginBottom: '20px' }}>
          <Timer remaining={eventState.remaining} isStarted={eventState.isStarted} isEnded={eventState.isEnded} />
        </div>

        {/* Waiting state */}
        {!eventState.isStarted && (
          <div style={{ ...s.card, ...s.waiting }}>
            <div style={s.waitIcon}>⏳</div>
            <div style={s.waitTitle}>Waiting for Organizer to Start</div>
            <div style={{ color: '#666', fontSize: '14px' }}>The event will begin shortly. Stay ready.</div>
          </div>
        )}

        {/* Problem */}
        {problem && (
          <div style={s.card}>
            <div style={s.categoryBadge}>📂 {problem.category}</div>
            <div style={s.problemTitle}>{problem.title}</div>

            <div style={{ marginBottom: '20px' }}>
              <div style={s.sectionLabel}>Problem Statement</div>
              <div style={s.desc}>{problem.description}</div>
            </div>

            {problem.constraints && (
              <div>
                <div style={s.sectionLabel}>Constraints</div>
                <div style={{ color: '#aaa', fontSize: '13px' }}>{problem.constraints}</div>
              </div>
            )}
          </div>
        )}

        {/* Vault */}
        {completed ? (
          <div style={s.vaultUnlocked}>
            <div style={s.vaultIcon}>🔓</div>
            <div style={{ ...s.vaultTitle, color: '#00ff88' }}>Vault Unlocked!</div>
            <div style={{ color: '#00ff88', fontSize: '18px', marginBottom: '8px' }}>👑 King Rescued!</div>
            <div style={{ color: '#00cc66', fontSize: '14px' }}>You have successfully cracked the vault.</div>
          </div>
        ) : (
          <div style={s.vaultLocked}>
            <div style={s.vaultIcon}>🔒</div>
            <div style={{ ...s.vaultTitle, color: '#f0c040' }}>Vault Locked</div>
            <div style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
              {locked ? (eventState.isEnded ? 'Event ended — submissions closed' : 'Waiting for event to start') : 'Submit your answer to unlock the vault'}
            </div>
            {submissionCount > 0 && <div style={{ color: '#666', fontSize: '13px', marginTop: '6px' }}>Attempts: {submissionCount}</div>}

            {!locked && (
              <div style={s.inputRow}>
                <input
                  style={s.answerInput}
                  placeholder="Enter your answer..."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  onFocus={e => e.target.style.border = '1px solid #f0c040'}
                  onBlur={e => e.target.style.border = '1px solid #2a2a4a'}
                />
                <button
                  style={submitting ? s.submitBtnDisabled : s.submitBtn}
                  onClick={handleSubmit}
                  disabled={submitting || locked}
                >
                  {submitting ? '...' : '🔑 Submit'}
                </button>
              </div>
            )}

            {feedback && (
              <div style={s.feedback(feedback.correct)}>{feedback.message}</div>
            )}
          </div>
        )}

        {/* Post-event scoreboard link */}
        {eventState.isEnded && (
          <div style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏆</div>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: '18px', color: '#f0c040', marginBottom: '8px' }}>Event Ended</div>
            <ScoreboardView />
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreboardView() {
  const [scores, setScores] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    API.get('/scoreboard').then(r => { setScores(r.data.scores); setLoaded(true); }).catch(() => {});
  }, []);

  if (!loaded) return <div style={{ color: '#888' }}>Loading scoreboard...</div>;

  return (
    <div>
      <div style={{ fontFamily: 'Cinzel,serif', fontSize: '20px', color: '#f0c040', marginBottom: '16px' }}>
        🏆 Final Standings
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a4a' }}>
            {['Rank', 'Team', 'Status', 'Time', 'Attempts'].map(h => (
              <th key={h} style={{ padding: '10px', color: '#f0c04099', textAlign: 'left', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scores.map((t, i) => (
            <tr key={t.teamName} style={{ borderBottom: '1px solid #1a1a2e', background: i % 2 === 0 ? '#ffffff05' : 'transparent' }}>
              <td style={{ padding: '10px', color: t.rank === 1 ? '#f0c040' : '#888' }}>{t.rank ? `#${t.rank}` : '-'}</td>
              <td style={{ padding: '10px', color: '#f0e6d3', fontWeight: 500 }}>{t.teamName}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ color: t.completed ? '#00ff88' : '#ff4444', fontSize: '12px', fontWeight: 600 }}>
                  {t.completed ? '🔓 Unlocked' : '🔒 Locked'}
                </span>
              </td>
              <td style={{ padding: '10px', color: '#aaa', fontFamily: 'monospace' }}>{t.completionTime || '--:--'}</td>
              <td style={{ padding: '10px', color: '#888' }}>{t.submissionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
