import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import 'leaflet/dist/leaflet.css';

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

interface Props {
  refreshKey: number;
}

export default function Map({ refreshKey }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    api.get('/photos').then(res => setPhotos(res.data));
  }, [refreshKey]);

  return (
    <MapContainer
      center={[48.5, 4.0]}
      zoom={7}
      style={{ height: '80vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {photos.map(photo => (
        <Marker key={photo.id} position={[photo.latitude, photo.longitude]}>
          <Popup>
            <div style={{ maxWidth: 200 }}>
              <img
                src={`http://localhost:5132${photo.imageUrl}`}
                alt="photo"
                style={{ width: '100%', borderRadius: 4 }}
              />
              {photo.aiDescription && (
                <p style={{ fontSize: 12, marginTop: 8 }}>{photo.aiDescription}</p>
              )}
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>
                {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}