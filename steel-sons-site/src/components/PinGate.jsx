import React, { useState, useEffect, useRef } from 'react';
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export default function PinGate({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('steelsons-session'));
    if (session && Date.now() - session.timestamp < EXPIRY_MS) {
      onUnlock(session.access); // 'user' or 'admin'
    }
    // Auto-focus the PIN input
    if (inputRef.current) inputRef.current.focus();
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-gray-900 text-center rounded-xl p-6 shadow-lg"
      >
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Enter Access PIN
        </h2>

        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="w-full text-center text-xl tracking-widest py-2 px-4 mb-4 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:text-white placeholder-gray-400"
        />

        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-md transition"
        >
          Unlock
        </button>

        {error && <p className="text-red-500 mt-3">{error}</p>}
      </form>
    </div>
  );
}
