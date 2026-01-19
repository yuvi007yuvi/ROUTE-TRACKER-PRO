import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icons
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function RouteMap() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        supabase.from('routes').select('*').eq('route_id', id).single()
            .then(({ data }) => setRoute(data));
    }, [id]);

    const handleStartRun = async () => {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            // In a real app, use the API URL from env, but for now we might mock or assume localhost if not set
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const res = await axios.post(`${apiUrl}/runs/start`, {
                route_id: id,
                user_id: user.id,
                start_time: new Date().toISOString()
            });
            navigate(`/field/run/${res.data.run_id}`, { state: { route } });
        } catch (e) {
            alert('Failed to start run');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!route) return <div>Loading...</div>;

    // Parse geometry. If it's stored as GeoJSON object in Supabase, we can use it.
    // Ensure coordinates are [lat, lng] for Leaflet (Tufr uses [lng, lat])
    // PostGIS returning GeoJSON: coordinates are [lng, lat]. Leaflet needs [lat, lng].

    const coordinates = route.geom?.coordinates?.map((c: any) => [c[1], c[0]]) || [];
    const startPoint = coordinates.length > 0 ? coordinates[0] : null;

    const googleMapsUrl = startPoint
        ? `https://www.google.com/maps/dir/?api=1&destination=${startPoint[0]},${startPoint[1]}`
        : '#';

    return (
        <div className="flex flex-col h-screen">
            <div className="h-2/3 w-full">
                {coordinates.length > 0 && (
                    <MapContainer center={startPoint || [28.6, 77.2] as any} zoom={15} scrollWheelZoom={true} className="h-full w-full">
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Polyline positions={coordinates} pathOptions={{ color: 'blue' }} />
                        {startPoint && <Marker position={startPoint}><Popup>Start</Popup></Marker>}
                    </MapContainer>
                )}
            </div>
            <div className="p-4 bg-white flex-1 flex flex-col gap-4">
                <h1 className="text-xl font-bold">{route.route_name}</h1>
                <p>Length: {route.length_km} km</p>

                <a href={googleMapsUrl} target="_blank" rel="noreferrer"
                    className="bg-green-600 text-white text-center py-3 rounded font-bold shadow">
                    Navigate to Start (Google Maps)
                </a>

                <button onClick={handleStartRun} disabled={loading}
                    className="bg-blue-600 text-white py-3 rounded font-bold shadow text-lg">
                    {loading ? 'Starting...' : 'Start Route Run'}
                </button>
            </div>
        </div>
    );
}
