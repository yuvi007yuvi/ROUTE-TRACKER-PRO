import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useRouteTracker } from '../../hooks/useRouteTracker';
import { generateSegments } from '../../utils/geo';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';

export default function RunningSession() {
    const { runId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // We try to get route from state, or fallback fetch
    const [route, setRoute] = useState<any>(location.state?.route || null);
    const [isEnded, setIsEnded] = useState(false);
    const [remarks, setRemarks] = useState('');

    // Fetch route if missing
    useEffect(() => {
        if (!route && runId) {
            supabase.from('route_runs').select('route_id, routes(*)').eq('run_id', runId).single()
                .then(({ data }) => {
                    setRoute(data?.routes);
                });
        }
    }, [runId, route]);

    // Prepare segments
    const segments = useMemo(() => {
        if (!route || !route.geom) return [];
        return generateSegments(route.geom, 30); // 30m segments
    }, [route]);

    const tracker = useRouteTracker({
        runId: runId || null,
        routeGeoJSON: route?.geom,
        initialSegments: segments,
        enabled: !isEnded && !!route
    });

    const handleEndRun = async () => {
        setIsEnded(true); // Stop tracking
    };

    const handleSubmit = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        await axios.post(`${apiUrl}/runs/end`, {
            run_id: runId,
            end_time: new Date().toISOString(),
            coverage_percent: tracker.coveragePercent,
            off_route_count: tracker.offRouteStreak, // This is current streak, need total incidents? Hook should track incidents.
            // Simplified: passing current stats.
            total_distance_m: tracker.stats.totalDistance,
            remarks,
            // proof_image_url: ...
        });
        alert('Run Submitted!');
        navigate('/field');
    };

    if (!route) return <div>Loading Route Data...</div>;

    const routeCoords = route.geom?.coordinates?.map((c: any) => [c[1], c[0]]) || [];
    const userPos = tracker.currentLocation
        ? [tracker.currentLocation.coords.latitude, tracker.currentLocation.coords.longitude] as [number, number]
        : routeCoords[0]; // fallback to start

    if (isEnded) {
        return (
            <div className="p-4 bg-gray-50 h-screen overflow-y-auto">
                <h1 className="text-2xl font-bold mb-6">Run Summary</h1>

                <div className="bg-white p-4 rounded shadow mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-2 border rounded">
                            <div className="text-sm text-gray-500">Coverage</div>
                            <div className="text-2xl font-bold text-blue-600">{tracker.coveragePercent}%</div>
                        </div>
                        <div className="p-2 border rounded">
                            <div className="text-sm text-gray-500">Distance</div>
                            <div className="text-2xl font-bold">{Math.round(tracker.stats.totalDistance)}m</div>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Remarks</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                    />
                </div>

                {/* Upload Proof Mock */}
                <div className="mb-6 p-4 border-2 border-dashed rounded text-center text-gray-500">
                    Upload Proof Photo (Optional)
                </div>

                <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-3 rounded font-bold text-lg">
                    Submit Report
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative">
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/90 backdrop-blur p-2 shadow-md flex justify-between items-center px-4">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Coverage</span>
                    <span className="font-bold text-xl">{tracker.coveragePercent}%</span>
                </div>
                <div className={clsx("px-3 py-1 rounded-full font-bold text-sm", tracker.isOnRoute ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {tracker.isOnRoute ? "ON ROUTE" : "OFF ROUTE"}
                </div>
                <button onClick={handleEndRun} className="bg-red-600 text-white px-4 py-1 rounded">
                    End
                </button>
            </div>

            {/* Off Route Alert */}
            {tracker.offRouteStreak >= 3 && (
                <div className="absolute top-20 left-4 right-4 z-[1000] bg-red-600 text-white p-4 rounded shadow-lg animate-pulse text-center font-bold">
                    ⚠️ YOU ARE OFF ROUTE! <br /> Return to path immediately.
                </div>
            )}

            {/* Map */}
            <div className="flex-1">
                <MapContainer center={userPos as any} zoom={18} zoomControl={false} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polyline positions={routeCoords} pathOptions={{ color: 'blue', weight: 5, opacity: 0.5 }} />
                    {/* Live User Dot */}
                    {tracker.currentLocation && (
                        <CircleMarker center={userPos} radius={8} color="white" fillColor="blue" fillOpacity={1} />
                    )}
                </MapContainer>
            </div>

            {/* Bottom Metrics */}
            <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white p-2 flex justify-around text-xs border-t">
                <div>
                    <span className="block text-gray-500">Dist. to Route</span>
                    <span className="font-bold">{Math.round(tracker.distanceToRoute)}m</span>
                </div>
                <div>
                    <span className="block text-gray-500">Run Dist.</span>
                    <span className="font-bold">{Math.round(tracker.stats.totalDistance)}m</span>
                </div>
                <div>
                    <span className="block text-gray-500">GPS Acc.</span>
                    <span className="font-bold">{Math.round(tracker.currentLocation?.coords.accuracy || 0)}m</span>
                </div>
            </div>
        </div>
    );
}
