import { useState } from 'react';
import api from '../api/axios';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await api.post('/auth/register', { email, password });
        setIsRegister(false);
        setError('Registered! Please log in.');
        return;
      }
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      onLogin();
    } catch (e: any) {
      setError(e.response?.data || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <button onClick={handleSubmit} style={{ width: '100%', padding: 10, background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        {isRegister ? 'Register' : 'Login'}
      </button>
      <p style={{ marginTop: 12, textAlign: 'center', cursor: 'pointer', color: '#2563eb' }}
        onClick={() => { setIsRegister(!isRegister); setError(''); }}>
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
      </p>
    </div>
  );
}