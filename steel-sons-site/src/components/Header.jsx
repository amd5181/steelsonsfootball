import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export default function Header({ access, onReset }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="relative flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-xl font-bold text-center w-full absolute left-0 right-0 mx-auto pointer-events-none select-none">
          Steel Sons Fantasy Football
        </h1>

        <button
          onClick={() => setMenuOpen(true)}
          className="z-50 text-2xl relative"
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={clsx(
          'fixed top-0 left-0 z-50 w-64 h-screen bg-white shadow-xl transition-transform duration-300 ease-in-out',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-500 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <ul className="space-y-3">
            <li>
              <Link
                to="/"
                className="text-rose-500 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Feed
              </Link>
            </li>
            <li>
              <Link
                to="/league-history"
                className="text-rose-500 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                League History
              </Link>
            </li>
            {/* New link for Record Book */}
            <li>
              <Link
                to="/record-book"
                className="text-rose-500 font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Record Book
              </Link>
            </li>
            {access === 'admin' && (
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReset();
                  }}
                  className="text-sm text-gray-500 underline"
                >
                  Reset Session
                </button>
              </li>
            )}
          </ul>

          <button
            onClick={() => {
              setMenuOpen(false);
              onReset();
            }}
            className="text-xs text-gray-400 mt-10 underline hover:text-rose-500 transition"
          >
            {access === 'admin' ? 'Admin Access — Reset' : 'Guest Access — Reset'}
          </button>
        </div>
      </div>
    </header>
  );
}
