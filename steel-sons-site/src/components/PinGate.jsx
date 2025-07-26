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
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 text-white w-11/12 max-w-sm p-6 rounded-2xl shadow-xl flex flex-col items-center"
      >
        <h2 className="text-xl font-bold mb-4 tracking-wide text-yellow-400">Steel Sons Access</h2>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="w-full p-3 rounded-lg bg-gray-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4"
        />

        <button
          type="submit"
          className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
        >
          Unlock
        </button>

        {error && <p className="text-red-500 mt-3">{error}</p>}
      </form>
    </div>
  );
}
