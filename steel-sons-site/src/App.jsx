import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PinGate from './components/PinGate';
import Header from './components/Header';
import Feed from './components/Feed';
import LeagueHistory from './components/LeagueHistory';

function App() {
  const [access, setAccess] = useState(null); // 'user' | 'admin' | null

  if (!access) return <PinGate onUnlock={setAccess} />;

  return (
    <Router>
      <div className="bg-pgh-gray min-h-screen text-white">
        <Header
          access={access}
          onReset={() => {
            localStorage.removeItem('steelsons-session');
            window.location.reload();
          }}
        />
        <main className="pt-4">
          <Routes>
            <Route path="/" element={<Feed access={access} />} />
            <Route path="/league-history" element={<LeagueHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
