import React, { useState, useEffect } from 'react';

const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export default function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('steelsons-session'));
    if (session && Date.now() - session.timestamp < EXPIRY_MS) {
      onUnlock(session.access); // 'user' or 'admin'
    }
  }, [onUnlock]);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === '2019') {
      localStorage.setItem(
        'steelsons-session',
        JSON.stringify({ access: 'user', timestamp: Date.now() })
      );
      onUnlock('user');
    } else if (pin === '2011') {
      localStorage.setItem(
        'steelsons-session',
        JSON.stringify({ access: 'admin', timestamp: Date.now() })
      );
      onUnlock('admin');
    } else {
      setError('Incorrect PIN');
    }
  }

  return (
    <div style={styles.overlay}>
      <form onSubmit={handleSubmit} style={styles.modal}>
        <h2>Enter Access PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={styles.input}
          placeholder="Enter PIN"
        />
        <button type="submit" style={styles.button}>Unlock</button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 9999
  },
  modal: {
    background: '#fff', padding: '2rem', borderRadius: '10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '300px'
  },
  input: {
    fontSize: '1rem', padding: '0.5rem', marginTop: '1rem', width: '100%'
  },
  button: {
    marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem'
  },
  error: {
    color: 'red', marginTop: '1rem'
  }
};
