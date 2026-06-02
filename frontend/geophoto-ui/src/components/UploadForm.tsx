import { useRef, useState } from 'react';
import api from '../api/axios';

interface Props {
  onUploaded: () => void;
}

export default function UploadForm({ onUploaded }: Props) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('✓ Uploaded');
      setTimeout(() => setStatus(''), 3000);
      onUploaded();
    } catch (e: any) {
      setStatus(e.response?.data || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          padding: '8px 18px',
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        {loading ? '⏳ Uploading...' : '📍 Upload Photo'}
      </button>
      {status && !loading && (
        <span style={{ fontSize: 12, color: status.includes('✓') ? '#16a34a' : '#dc2626' }}>
          {status}
        </span>
      )}
    </div>
  );
}