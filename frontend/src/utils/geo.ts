import * as turf from '@turf/turf';

export const isPointOnRoute = (point: [number, number], routeLineString: any, thresholdMeters: number = 25) => {
    if (!routeLineString) return { isOnRoute: false, distance: 9999 };
    const pt = turf.point(point);
    // Determine if input is Feature or Geometry
    const line = routeLineString.geometry ? routeLineString : turf.lineString(routeLineString.coordinates);

    const distance = turf.pointToLineDistance(pt, line, { units: 'meters' });
    return { isOnRoute: distance <= thresholdMeters, distance };
};

export const checkSegmentCoverage = (point: [number, number], segments: any[], thresholdMeters: number = 25) => {
    // segments: Array of { id: string, midpoint: [lng, lat], covered: boolean }
    const pt = turf.point(point);
    const newlyCovered: string[] = [];

    for (const seg of segments) {
        if (seg.covered) continue;
        // midpoints in KML might be [lng, lat]
        const dist = turf.distance(pt, turf.point(seg.midpoint), { units: 'meters' });
        if (dist <= thresholdMeters) {
            newlyCovered.push(seg.id);
        }
    }
    return newlyCovered;
};

// Helper to split route into segments
export const generateSegments = (routeLineString: any, segmentLengthMeters: number = 30) => {
    const line = routeLineString.geometry ? routeLineString : turf.lineString(routeLineString.coordinates);
    const length = turf.length(line, { units: 'meters' });
    const segments = [];
    const count = Math.ceil(length / segmentLengthMeters);

    for (let i = 0; i < count; i++) {
        // Find midpoint of this segment approx
        // A better way: slice the line into chunks, take midpoint of chunk.
        // Or simplified: specific point at (i * 30) + 15 meters along the line.
        const distAlong = (i * segmentLengthMeters) + (segmentLengthMeters / 2);
        if (distAlong > length) break;

        const midpoint = turf.along(line, distAlong, { units: 'meters' });
        segments.push({
            id: crypto.randomUUID(), // specific to internal use if not from DB
            midpoint: midpoint.geometry.coordinates,
            covered: false
        });
    }
    return segments;
};
