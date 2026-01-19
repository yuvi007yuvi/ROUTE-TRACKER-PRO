import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getRoutes = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('routes').select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

export const getRouteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('routes').select('*').eq('route_id', id).single();
    if (error) return res.status(404).json({ error: 'Route not found' });
    res.json(data);
};

export const createRoute = async (req: Request, res: Response) => {
    const { route_name, zone, ward, route_type, geom, length_km } = req.body;

    // Note: Geometries should be passed as GeoJSON or WKT. Supabase/PostGIS handles GeoJSON automatically if configured,
    // but usually we might need to cast simple GeoJSON to the geometry type in the insert, or rely on the client sending correct format.
    // For simplicitly, we assume the frontend sends a valid GeoJSON geometry object which Supabase client handles or we format it.

    const { data, error } = await supabase.from('routes').insert([
        { route_name, zone, ward, route_type, geom, length_km }
    ]).select();

    if (error) return res.status(400).json({ error: error.message });

    // Generate segments Logic would go here triggers or separate service
    // For this MVF (Minimum Viable Feature), we can calculate segments on the frontend or a stored procedure.

    res.status(201).json(data);
};

export const deleteRoute = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase.from('routes').delete().eq('route_id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Route deleted' });
};

// Placeholder for update
export const updateRoute = async (req: Request, res: Response) => {
    // Implementation
};

import { DOMParser } from 'xmldom';
// @ts-ignore
import toGeoJSON from '@mapbox/togeojson';

export const uploadRoute = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileContent = req.file.buffer.toString('utf-8');
        let geoJson: any;

        if (req.file.originalname.endsWith('.kml')) {
            const kml = new DOMParser().parseFromString(fileContent);
            geoJson = toGeoJSON.kml(kml);
        } else {
            // Assume JSON/GeoJSON
            geoJson = JSON.parse(fileContent);
        }

        // Extract LineString - simplify assumption: First feature is the route
        const feature = geoJson.features?.find((f: any) => f.geometry.type === 'LineString');
        if (!feature) return res.status(400).json({ error: 'No LineString found in file' });

        const { route_name, zone, ward } = req.body;

        // Calculate length (approx) - or leave null
        const geom = feature.geometry;

        const { data, error } = await supabase.from('routes').insert([
            {
                route_name: route_name || feature.properties.name || 'Uploaded Route',
                zone,
                ward,
                geom,
                length_km: 0 // Calculate if needed
            }
        ]).select();

        if (error) throw error;
        res.json(data[0]);

    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};
