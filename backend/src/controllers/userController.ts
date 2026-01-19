import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getUsers = async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

export const assignRoute = async (req: Request, res: Response) => {
    const { user_id, route_id } = req.body;
    const { data, error } = await supabase.from('assignments').insert([
        { user_id, route_id, active: true }
    ]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, phone, role, zone } = req.body;
    const { data, error } = await supabase.from('users').insert([
        { name, email, phone, role: role || 'field', zone }
    ]).select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, zone } = req.body;

    const { data, error } = await supabase.from('users').update({ role, zone }).eq('id', id).select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};

export const getUserAssignments = async (req: Request, res: Response) => {
    const { userId } = req.params;
    // Join assignments with routes
    const { data, error } = await supabase
        .from('assignments')
        .select(`
      assignment_id,
      active,
      routes:route_id (*)
    `)
        .eq('user_id', userId)
        .eq('active', true);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
};
