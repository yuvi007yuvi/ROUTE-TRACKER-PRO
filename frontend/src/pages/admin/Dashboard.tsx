import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export default function AdminDashboard() {
    const [tab, setTab] = useState('dashboard'); // dashboard, routes, assignments, runs
    const [stats, setStats] = useState({ routes: 0, users: 0, runs: 0 });

    useEffect(() => {
        // Mock stats or fetch
        Promise.all([
            supabase.from('routes').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('route_runs').select('*', { count: 'exact', head: true })
        ]).then(([r, u, rr]) => {
            setStats({ routes: r.count || 0, users: u.count || 0, runs: rr.count || 0 });
        });
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white p-4">
                <h1 className="text-xl font-bold mb-8">Admin Portal</h1>
                <nav className="space-y-2">
                    <button onClick={() => setTab('dashboard')} className={`block w-full text-left p-2 rounded ${tab === 'dashboard' ? 'bg-slate-700' : ''}`}>Dashboard</button>
                    <button onClick={() => setTab('routes')} className={`block w-full text-left p-2 rounded ${tab === 'routes' ? 'bg-slate-700' : ''}`}>Routes</button>
                    <button onClick={() => setTab('users')} className={`block w-full text-left p-2 rounded ${tab === 'users' ? 'bg-slate-700' : ''}`}>Users</button>
                    <button onClick={() => setTab('assignments')} className={`block w-full text-left p-2 rounded ${tab === 'assignments' ? 'bg-slate-700' : ''}`}>Assignments</button>
                    <button onClick={() => setTab('runs')} className={`block w-full text-left p-2 rounded ${tab === 'runs' ? 'bg-slate-700' : ''}`}>Route Runs</button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {tab === 'dashboard' && <DashboardStats stats={stats} />}
                {tab === 'routes' && <RoutesManager />}
                {tab === 'users' && <UsersManager />}
                {tab === 'assignments' && <AssignmentsManager />}
                {tab === 'runs' && <RunsMonitor />}
            </div>
        </div>
    );
}

function DashboardStats({ stats }: any) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <div className="text-gray-500">Total Routes</div>
                    <div className="text-3xl font-bold">{stats.routes}</div>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <div className="text-gray-500">Total Users</div>
                    <div className="text-3xl font-bold">{stats.users}</div>
                </div>
                <div className="bg-white p-6 rounded shadow">
                    <div className="text-gray-500">Total Runs</div>
                    <div className="text-3xl font-bold">{stats.runs}</div>
                </div>
            </div>
        </div>
    );
}

function RoutesManager() {
    const [routes, setRoutes] = useState<any[]>([]);

    useEffect(() => {
        supabase.from('routes').select('*').then(({ data }) => setRoutes(data || []));
    }, []);

    // Placeholder for Create Route
    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Routes Management</h2>
                <div className="bg-white p-4 rounded shadow border">
                    <h4 className="font-bold mb-2 text-sm">Upload Route (KML/GeoJSON)</h4>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const fileInput = (e.target as any).file;
                        if (!fileInput.files[0]) return alert('Select a file');

                        const data = new FormData();
                        data.append('file', fileInput.files[0]);
                        const zone = formData.get('zone');
                        if (zone) data.append('zone', zone as string);

                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        try {
                            await axios.post(`${apiUrl}/routes/upload`, data);
                            alert('Route Uploaded');
                            (e.target as HTMLFormElement).reset();
                            // Refresh list
                            const { data: routes } = await supabase.from('routes').select('*');
                            setRoutes(routes || []);
                        } catch (err: any) {
                            console.error(err);
                            alert('Upload Failed');
                        }
                    }} className="flex gap-2 items-end">
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">File</label>
                            <input type="file" name="file" accept=".kml,.json,.geojson" className="text-sm" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs mb-1">Zone</label>
                            <input name="zone" placeholder="Zone Name" className="border p-1 rounded text-sm w-24" />
                        </div>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">Upload</button>
                    </form>
                </div>
            </div>
            <div className="bg-white rounded shadow">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left">Route Name</th>
                            <th className="p-4 text-left">Zone</th>
                            <th className="p-4 text-left">Length (km)</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {routes.map(r => (
                            <tr key={r.route_id} className="border-b">
                                <td className="p-4">{r.route_name}</td>
                                <td className="p-4">{r.zone}</td>
                                <td className="p-4">{r.length_km}</td>
                                <td className="p-4 text-blue-600 cursor-pointer">Edit</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UsersManager() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        supabase.from('users').select('*').order('created_at', { ascending: false })
            .then(({ data }) => setUsers(data || []));
    };

    const handleUpdate = async (id: string, field: string, value: string) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await axios.put(`${apiUrl}/users/${id}`, { [field]: value });
        fetchUsers();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Users Management</h2>

            <div className="bg-white p-6 rounded shadow mb-6">
                <h3 className="font-bold mb-4">Create New User</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    try {
                        await axios.post(`${apiUrl}/users`, {
                            name: formData.get('name'),
                            email: formData.get('email'),
                            role: formData.get('role'),
                            zone: formData.get('zone')
                        });
                        alert('User Created');
                        (e.target as HTMLFormElement).reset();
                        fetchUsers();
                    } catch (err: any) {
                        alert(err.response?.data?.error || err.message);
                    }
                }} className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="block text-xs font-bold mb-1">Name</label>
                        <input name="name" required className="border p-2 rounded" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">Email</label>
                        <input name="email" type="email" required className="border p-2 rounded" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">Role</label>
                        <select name="role" className="border p-2 rounded w-32">
                            <option value="field">Field User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">Zone</label>
                        <input name="zone" className="border p-2 rounded w-32" placeholder="North" />
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Create</button>
                </form>
            </div>

            <div className="bg-white rounded shadow text-sm">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Role</th>
                            <th className="p-4 text-left">Zone</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b">
                                <td className="p-4">{u.name}</td>
                                <td className="p-4">{u.email}</td>
                                <td className="p-4">
                                    <select
                                        value={u.role || 'field'}
                                        onChange={(e) => handleUpdate(u.id, 'role', e.target.value)}
                                        className="border rounded p-1"
                                    >
                                        <option value="field">Field User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-4">
                                    <input
                                        defaultValue={u.zone}
                                        onBlur={(e) => handleUpdate(u.id, 'zone', e.target.value)}
                                        className="border rounded p-1 w-24"
                                        placeholder="Zone"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AssignmentsManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRoute, setSelectedRoute] = useState('');

    useEffect(() => {
        supabase.from('users').select('*').neq('role', 'admin').then(({ data }) => setUsers(data || []));
        supabase.from('routes').select('*').then(({ data }) => setRoutes(data || []));
        fetchAssignments();
    }, []);

    const fetchAssignments = () => {
        supabase.from('assignments').select('*, users(name), routes(route_name)')
            .then(({ data }) => setAssignments(data || []));
    }

    const handleAssign = async () => {
        if (!selectedUser || !selectedRoute) return alert('Select user and route');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        try {
            await axios.post(`${apiUrl}/assignments`, {
                user_id: selectedUser,
                route_id: selectedRoute
            });
            alert('Assigned!');
            fetchAssignments();
        } catch (e: any) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Route Assignments</h2>

            <div className="bg-white p-6 rounded shadow mb-6 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-bold mb-1">Select Field User</label>
                    <select className="border p-2 rounded w-64" onChange={e => setSelectedUser(e.target.value)}>
                        <option value="">-- Select User --</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.zone})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-1">Select Route</label>
                    <select className="border p-2 rounded w-64" onChange={e => setSelectedRoute(e.target.value)}>
                        <option value="">-- Select Route --</option>
                        {routes.map(r => <option key={r.route_id} value={r.route_id}>{r.route_name}</option>)}
                    </select>
                </div>
                <button onClick={handleAssign} className="bg-green-600 text-white px-6 py-2 rounded font-bold">Assign</button>
            </div>

            <div className="bg-white rounded shadow">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-left">User</th>
                            <th className="p-4 text-left">Route</th>
                            <th className="p-4 text-left">Assigned Date</th>
                            <th className="p-4 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(a => (
                            <tr key={a.assignment_id} className="border-b">
                                <td className="p-4 font-medium">{a.users?.name}</td>
                                <td className="p-4">{a.routes?.route_name}</td>
                                <td className="p-4 text-gray-500">{new Date(a.assigned_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={a.active ? "text-green-600 font-bold" : "text-red-500"}>
                                        {a.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RunsMonitor() {
    return <div><h2 className="text-2xl font-bold">Runs Monitoring</h2><p>Coming soon...</p></div>;
}
