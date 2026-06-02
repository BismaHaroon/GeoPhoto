import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Photo {
  id: string;
  fileName: string;
  latitude: number;
  longitude: number;
  aiDescription: string | null;
  createdAt: string;
  imageUrl: string;
}

interface Comment {
  id: string;
  text: string;
  email: string;
  createdAt: string;
}

interface Props {
  refreshKey: number;
  onDeleted?: () => void;
}

function PhotoPopup({ photo, onDeleted }: { photo: Photo; onDeleted: (id: string) => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string | null>(photo.aiDescription);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/photos/${photo.id}/comments`).then(res => setComments(res.data));
  }, [photo.id]);

  useEffect(() => {
    if (description) return;
    const interval = setInterval(async () => {
      const res = await api.get(`/photos/${photo.id}`);
      if (res.data.aiDescription) {
        setDescription(res.data.aiDescription);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [photo.id, description]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/photos/${photo.id}/comments`, { text: newComment });
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return;
    setDeleting(true);
    try {
      await api.delete(`/photos/${photo.id}`);
      onDeleted(photo.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 220 }}>
      <div style={{ position: 'relative' }}>
        <img
          src={`http://localhost:5132${photo.imageUrl}`}
          alt="photo"
          style={{ width: '100%', borderRadius: 4 }}
        />
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete photo"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(220,38,38,0.85)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            fontSize: 12,
            padding: '3px 7px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {deleting ? '...' : '🗑 Delete'}
        </button>
      </div>

      {description ? (
        <p style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic', color: '#475569' }}>{description}</p>
      ) : (
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>⏳ Generating description...</p>
      )}
      <p style={{ fontSize: 11, color: '#888', margin: '4px 0 8px' }}>
        {new Date(photo.createdAt).toLocaleDateString()}
      </p>

      <div style={{ borderTop: '1px solid #eee', paddingTop: 8 }}>
        <strong style={{ fontSize: 12 }}>Comments</strong>
        <div style={{ maxHeight: 120, overflowY: 'auto', margin: '6px 0' }}>
          {comments.length === 0 && (
            <p style={{ fontSize: 11, color: '#aaa' }}>No comments yet.</p>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{c.email}</span>
              <p style={{ fontSize: 12, margin: '2px 0 0' }}>{c.text}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{ flex: 1, padding: '4px 6px', fontSize: 12, border: '1px solid #ccc', borderRadius: 4 }}
            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={loading}
            style={{ padding: '4px 8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}
          >
            {loading ? '...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Map({ refreshKey, onDeleted }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    api.get('/photos').then(res => setPhotos(res.data));
  }, [refreshKey]);

  const handleDeleted = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    onDeleted?.();
  };

  if (photos.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#94a3b8'
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🗺️</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#475569', marginBottom: 8 }}>No photos yet</h2>
        <p style={{ fontSize: 14 }}>Upload a geotagged photo to see it appear on the map</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[48.5, 4.0]}
      zoom={7}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup>
        {photos.map(photo => (
          <Marker key={photo.id} position={[photo.latitude, photo.longitude]}>
            <Popup>
              <PhotoPopup photo={photo} onDeleted={handleDeleted} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}