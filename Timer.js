import React, { useState } from 'react';
import API from '../api';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-conic-gradient(#1a1a2e44 0% 25%, transparent 0% 50%)',
    backgroundSize: '60px 60px',
    opacity: 0.4,
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)',
    border: '1px solid #f0c04044',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%', maxWidth: '440px',
    boxShadow: '0 0 60px #f0c04022, 0 20px 60px #00000088',
  },
  kingIcon: { fontSize: '56px', textAlign: 'center', marginBottom: '8px', filter: 'drop-shadow(0 0 12px #f0c040)' },
  title: { fontFamily: 'Cinzel, serif', fontSize: '28px', fontWeight: 900, textAlign: 'center', color: '#f0c040', marginBottom: '6px', letterSpacing: '2px' },
  subtitle: { textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '36px' },
  label: { display: 'block', color: '#f0c040', fontSize: '12px', fontWeight: 600, marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' },
  input: {
    width: '100%', background: '#0d0d0d', border: '1px solid #2a2a4a', borderRadius: '8px',
    padding: '14px 16px', color: '#f0e6d3', fontSize: '16px', outline: 'none',
    transition: 'border 0.2s',
    fontFamily: 'Inter, sans-serif',
  },
  btn: {
    width: '100%', marginTop: '24px',
    background: 'linear-gradient(135deg, #f0c040, #c49a28)',
    border: 'none', borderRadius: '8px',
    padding: '15px', fontSize: '16px', fontWeight: 700,
    color: '#0d0d0d', cursor: 'pointer',
    fontFamily: 'Cinzel, serif', letterSpacing: '1px',
    transition: 'transform 0.1s, opacity 0.1s',
  },
  error: {
    background: '#ff444422', border: '1px solid #ff4444', borderRadius: '8px',
    padding: '12px 16px', marginTop: '16px', color: '#ff8888', fontSize: '14px', textAlign: 'center',
  },
  divider: { textAlign: 'center', margin: '24px 0 0', color: '#555', fontSize: '12px' },
  adminLink: { color: '#f0c04099', textDecoration: 'none', marginLeft: '6px' },
};

export default function LoginPage({ onLogin }) {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) { setError('Please enter your team name'); return; }
    setLoading(true); setError('');
    try {
      const res = await API.post('/auth/login', { teamName: teamName.trim() });
      localStorage.setItem('vb_token', res.data.token);
      localStorage.setItem('vb_team', res.data.teamName);
      onLogin(res.data.teamName);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgPattern} />
      <div style={styles.card}>
        <div style={styles.kingIcon}>♚</div>
        <h1 style={styles.title}>Vault Break</h1>
        <p style={styles.subtitle}>Chess Tech Event — Enter your team name to begin</p>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>Team Name</label>
          <input
            style={styles.input}
            placeholder="e.g. AlphaKnights"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            autoFocus
            onFocus={e => e.target.style.border = '1px solid #f0c040'}
            onBlur={e => e.target.style.border = '1px solid #2a2a4a'}
          />
          {error && <div style={styles.error}>⚠️ {error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}
            onMouseOver={e => e.target.style.opacity = '0.85'}
            onMouseOut={e => e.target.style.opacity = '1'}>
            {loading ? 'Verifying...' : '⚔️ Enter the Arena'}
          </button>
        </form>

        <div style={styles.divider}>
          Organizer?{' '}
          <a href="/organizer" style={styles.adminLink}>Admin Panel →</a>
        </div>
      </div>
    </div>
  );
}
