import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const startRun = async (req: Request, res: Response) => {
    const { route_id, user_id, start_time } = req.body;
    const { data, error } = await supabase.from('route_runs').insert([
        { route_id, user_id, start_time, status: 'started' }
    ]).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
};

export const savePoint = async (req: Request, res: Response) => {
    const { run_id, point } = req.body; // point can be single object or array

    // Clean structure if needed. Assuming point matches DB schema cols roughly or we map it.
    // Schema: point_id, run_id, ts, geom, accuracy_m, speed, is_on_route, distance_to_route_m

    if (!point) return res.status(400).json({ error: 'No point data' });

    const pointsToInsert = Array.isArray(point) ? point : [point];

    const records = pointsToInsert.map(p => ({
        run_id,
        ts: p.timestamp || new Date().toISOString(),
        geom: `POINT(${p.longitude} ${p.latitude})`, // Construct WKT
        accuracy_m: p.accuracy,
        speed: p.speed,
        is_on_route: p.isOnRoute,
        distance_to_route_m: p.distanceToRoute
    }));

    const { error } = await supabase.from('route_run_points').insert(records);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Points saved' });
};

export const endRun = async (req: Request, res: Response) => {
    const { run_id, end_time, coverage_percent, off_route_count, total_distance_m, remarks, proof_image_url } = req.body;

    const { data, error } = await supabase.from('route_runs').update({
        status: 'completed',
        end_time,
        coverage_percent,
        off_route_count,
        total_distance_m,
        remarks,
        proof_image_url
    }).eq('run_id', run_id).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

export const getRuns = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('route_runs').select('*, routes(route_name), users(name)');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

export const getRunDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    // Fetch run info + points
    const { data: run, error: runError } = await supabase.from('route_runs').select('*, routes(*)').eq('run_id', id).single();
    if (runError) return res.status(404).json({ error: runError.message });

    // We might not want to return ALL points if there are thousands, but for playback we might need them.
    // Pagination might be needed for huge runs.
    const { data: points, error: pointsError } = await supabase
        .from('route_run_points')
        .select('*')
        .eq('run_id', id)
        .order('ts', { ascending: true });

    if (pointsError) return res.status(400).json({ error: pointsError.message });

    res.json({ run, points });
};
