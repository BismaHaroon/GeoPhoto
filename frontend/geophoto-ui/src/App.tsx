import { useState, useRef } from 'react';
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
    <div style={{ padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
        <h1 style={{ margin: 0 }}>GeoPhoto</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
      </div>
      <UploadForm onUploaded={() => setRefreshKey(k => k + 1)} />
      <Map refreshKey={refreshKey} />
    </div>
  );
}

export default App;