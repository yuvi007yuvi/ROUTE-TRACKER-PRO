import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export default function FieldDashboard() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user.id) return;
        supabase.from('assignments')
            .select('*, routes(*)')
            .eq('user_id', user.id)
            .eq('active', true)
            .then(({ data }) => setAssignments(data || []));
    }, [user.id]);

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">My Routes</h1>
            {assignments.length === 0 && <p>No routes assigned.</p>}
            <div className="space-y-4">
                {assignments.map((a: any) => (
                    <div key={a.assignment_id} className="bg-white p-4 rounded shadow">
                        <h2 className="text-lg font-bold">{a.routes.route_name}</h2>
                        <p className="text-gray-500">{a.routes.ward} - {a.routes.zone}</p>
                        <Link to={`/field/route/${a.routes.route_id}`} className="block mt-4 text-center bg-blue-600 text-white py-2 rounded">
                            Open Route
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
