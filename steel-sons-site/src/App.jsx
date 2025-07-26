import React, { useState } from 'react';
import PinGate from './components/PinGate';
import Header from './components/Header';
import Feed from './components/Feed';

function App() {
  const [access, setAccess] = useState(null); // 'user' | 'admin' | null

  if (!access) return <PinGate onUnlock={setAccess} />;

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header
        access={access}
        onReset={() => {
          localStorage.removeItem('steelsons-session');
          window.location.reload();
        }}
      />
      <main className="pt-4">
        <Feed access={access} />
      </main>
    </div>
  );
}

export default App;
