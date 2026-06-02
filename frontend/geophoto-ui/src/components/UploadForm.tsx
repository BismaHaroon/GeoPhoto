import { useRef, useState } from 'react';
import api from '../api/axios';

interface Props {
  onUploaded: () => void;
}

export default function UploadForm({ onUploaded }: Props) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('✓ Uploaded!');
      setFile(null);
      setPreview(null);
      setTimeout(() => setStatus(''), 3000);
      onUploaded();
    } catch (e: any) {
      setStatus(e.response?.data || 'Upload failed.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreview(null);
    setStatus('');
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
          e.target.value = '';
        }}
      />

      {/* Upload button */}
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          padding: '8px 18px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        📍 Upload Photo
      </button>

      {status && !preview && (
        <span style={{ fontSize: 12, color: status.includes('✓') ? '#16a34a' : '#dc2626' }}>
          {status}
        </span>
      )}

      {/* Modal */}
      {preview && (
        <div
          onClick={handleCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Upload Photo</h3>
              <button
                onClick={handleCancel}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <img
              src={preview}
              alt="preview"
              style={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 12
              }}
            />

            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📎 {file?.name}
            </p>

            {status && (
              <p style={{ fontSize: 13, color: status.includes('✓') ? '#16a34a' : '#dc2626', marginBottom: 12 }}>
                {status}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#64748b',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '10px',
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Uploading...' : '⬆️ Upload to Map'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}