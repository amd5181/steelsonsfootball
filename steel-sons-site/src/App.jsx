import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PinGate from './components/PinGate';
import Header from './components/Header';
import Feed from './components/Feed';
import LeagueHistory from './components/LeagueHistory';
import RecordBook from './components/RecordBook'; // Import the new RecordBook component

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
            <Route path="/record-book" element={<RecordBook />} /> {/* New Route for Record Book */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
