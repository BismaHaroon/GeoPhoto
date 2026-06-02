import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Map from './components/Map';
import UploadForm from './components/UploadForm';
import api from './api/axios';

function getEmailFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null;
  } catch {
    return null;
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [refreshKey, setRefreshKey] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/photos').then(res => setPhotoCount(res.data.length));
  }, [refreshKey, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          {photoCount > 0 && (
            <span style={{
              background: '#f1f5f9',
              color: '#64748b',
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              border: '1px solid #e2e8f0'
            }}>
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UploadForm onUploaded={() => setRefreshKey(k => k + 1)} />
          <span style={{ fontSize: 13, color: '#64748b' }}>
            👤 {getEmailFromToken()}
          </span>
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

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Map refreshKey={refreshKey} onDeleted={() => setRefreshKey(k => k + 1)} />
      </div>
    </div>
  );
}

export default App;