import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import PinGate from './components/PinGate';
import Header from './components/Header';
import Feed from './components/Feed';
import LeagueHistory from './components/LeagueHistory';
import RecordBook from './components/RecordBook';

function App() {
  const [access, setAccess] = useState(null); // 'user' | 'admin' | null

  if (!access) return <PinGate onUnlock={setAccess} />;

  return (
    <Router>
      <div className="bg-gray-100 min-h-screen">
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
            {/* use /recordbook (no hyphen) to match the URL you’ve been using */}
            <Route path="/recordbook" element={<RecordBook />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
