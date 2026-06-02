import { useState } from 'react';
import Login from './pages/Login';
import Map from './components/Map';
import UploadForm from './components/UploadForm';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🗺️</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>GeoPhoto</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UploadForm onUploaded={() => setRefreshKey(k => k + 1)} />
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 13,
              color: '#64748b',
              fontWeight: 500
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Map takes all remaining height */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Map refreshKey={refreshKey} />
      </div>
    </div>
  );
}

export default App;