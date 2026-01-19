import { useState, useEffect, useRef, useCallback } from 'react';
import * as turf from '@turf/turf';
import { isPointOnRoute, checkSegmentCoverage } from '../utils/geo';
import { supabase } from '../lib/supabase';

interface TrackerOptions {
    runId: string | null;
    routeGeoJSON: any; // GeoJSON LineString
    initialSegments: any[]; // { id, midpoint, covered }
    enabled: boolean;
}

export const useRouteTracker = ({ runId, routeGeoJSON, initialSegments, enabled }: TrackerOptions) => {
    const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
    const [segments, setSegments] = useState(initialSegments);
    const [coveragePercent, setCoveragePercent] = useState(0);
    const [isOnRoute, setIsOnRoute] = useState(true);
    const [distanceToRoute, setDistanceToRoute] = useState(0);
    const [offRouteStreak, setOffRouteStreak] = useState(0);
    const [stats, setStats] = useState({ totalDistance: 0, pointsCount: 0 });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const lastSavedPoint = useRef<{ lat: number, lng: number, time: number } | null>(null);
    const pendingQueue = useRef<any[]>([]);

    // Calculate coverage percentage whenever segments update
    useEffect(() => {
        if (segments.length === 0) return;
        const covered = segments.filter(s => s.covered).length;
        setCoveragePercent(Math.round((covered / segments.length) * 100));
    }, [segments]);

    const savePoint = useCallback(async (pointPayload: any) => {
        if (!runId) return;

        // Optimistic local save or queue
        pendingQueue.current.push(pointPayload);

        if (navigator.onLine) {
            // Flush queue
            const batch = [...pendingQueue.current];
            pendingQueue.current = []; // Clear immediately to avoid dups, handle fail by putting back? 
            // Simple retry logic: if fail, put back.

            try {
                const { error } = await supabase.from('route_run_points').insert(batch.map(p => ({
                    run_id: runId,
                    ts: p.timestamp,
                    geom: `POINT(${p.longitude} ${p.latitude})`,
                    accuracy_m: p.accuracy,
                    speed: p.speed,
                    is_on_route: p.isOnRoute,
                    distance_to_route_m: p.distanceToRoute
                })));

                if (error) throw error;
            } catch (err) {
                console.error('Failed to sync points, saving local', err);
                pendingQueue.current = [...batch, ...pendingQueue.current]; // Re-queue
            }
        }
    }, [runId]);

    const processPosition = useCallback((pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        // const point = [longitude, latitude]; // Turf uses [lng, lat]
        const timestamp = pos.timestamp;

        setCurrentLocation(pos);

        // 1. Accuracy Filter
        if (accuracy > 25) {
            // Ignore bad points but maybe show UI specific warning
            return;
        }

        // 2. On-Route Check
        let onRouteStatus = { isOnRoute: false, distance: 9999 };
        if (routeGeoJSON) {
            onRouteStatus = isPointOnRoute([longitude, latitude], routeGeoJSON);
            setIsOnRoute(onRouteStatus.isOnRoute);
            setDistanceToRoute(onRouteStatus.distance);

            if (!onRouteStatus.isOnRoute) {
                setOffRouteStreak(prev => prev + 1);
            } else {
                setOffRouteStreak(0);
            }
        }

        // 3. Coverage Check
        if (routeGeoJSON && segments.length > 0) {
            const newlyCoveredIds = checkSegmentCoverage([longitude, latitude], segments);
            if (newlyCoveredIds.length > 0) {
                setSegments(prev => prev.map(s =>
                    newlyCoveredIds.includes(s.id) ? { ...s, covered: true } : s
                ));
            }
        }

        // 4. Save Logic (Rule: 10s or 20m)
        const now = Date.now();
        let shouldSave = false;

        if (!lastSavedPoint.current) {
            shouldSave = true;
        } else {
            const timeDiff = (now - lastSavedPoint.current.time) / 1000;
            const distDiff = turf.distance(
                turf.point([lastSavedPoint.current.lng, lastSavedPoint.current.lat]),
                turf.point([longitude, latitude]),
                { units: 'meters' }
            );

            if (timeDiff >= 10 || distDiff >= 20) {
                shouldSave = true;
            }

            if (shouldSave) {
                setStats(prev => ({
                    pointsCount: prev.pointsCount + 1,
                    totalDistance: prev.totalDistance + distDiff
                }));
            }
        }

        if (shouldSave && runId) {
            savePoint({
                timestamp: new Date(timestamp).toISOString(),
                latitude,
                longitude,
                accuracy,
                speed,
                isOnRoute: onRouteStatus.isOnRoute,
                distanceToRoute: onRouteStatus.distance
            });
            lastSavedPoint.current = { lat: latitude, lng: longitude, time: now };
        }

    }, [runId, routeGeoJSON, segments, savePoint]);

    useEffect(() => {
        if (!enabled) return;
        const watchId = navigator.geolocation.watchPosition(
            processPosition,
            (err) => setErrorMsg(err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [enabled, processPosition]);

    return {
        currentLocation,
        coveragePercent,
        isOnRoute,
        offRouteStreak,
        distanceToRoute,
        stats,
        errorMsg
    };
};
