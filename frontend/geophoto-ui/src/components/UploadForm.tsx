import { useState } from 'react';
import api from '../api/axios';

interface Props {
  onUploaded: () => void;
}

export default function UploadForm({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setStatus('');
    try {
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('Photo uploaded successfully!');
      setFile(null);
      onUploaded();
    } catch (e: any) {
      setStatus(e.response?.data || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0' }}>
      <input
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {status && <span style={{ fontSize: 13, color: status.includes('success') ? 'green' : 'red' }}>{status}</span>}
    </div>
  );
}