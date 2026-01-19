-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT CHECK (role IN ('admin', 'field')),
    zone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Routes Table
CREATE TABLE IF NOT EXISTS routes (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT NOT NULL,
    zone TEXT,
    ward TEXT,
    route_type TEXT,
    geom GEOMETRY(LineString, 4326),
    start_geom GEOMETRY(Point, 4326),
    end_geom GEOMETRY(Point, 4326),
    length_km FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Route Segments Table
CREATE TABLE IF NOT EXISTS route_segments (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
    segment_index INTEGER,
    midpoint_geom GEOMETRY(Point, 4326),
    covered_default BOOLEAN DEFAULT FALSE
);

-- 4. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(route_id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

-- 5. Route Runs Table
CREATE TABLE IF NOT EXISTS route_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(route_id),
    user_id UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    coverage_percent FLOAT DEFAULT 0,
    off_route_count INTEGER DEFAULT 0,
    total_distance_m FLOAT DEFAULT 0,
    status TEXT CHECK (status IN ('started', 'completed', 'aborted')),
    remarks TEXT,
    proof_image_url TEXT
);

-- 6. Route Run Points Table (High Volume)
CREATE TABLE IF NOT EXISTS route_run_points (
    point_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES route_runs(run_id) ON DELETE CASCADE,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    geom GEOMETRY(Point, 4326),
    accuracy_m FLOAT,
    speed FLOAT,
    is_on_route BOOLEAN,
    distance_to_route_m FLOAT
);

-- 7. Route Run Segment Coverage Table
CREATE TABLE IF NOT EXISTS route_run_segment_coverage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID REFERENCES route_runs(run_id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(route_id),
    segment_id UUID REFERENCES route_segments(segment_id),
    covered BOOLEAN DEFAULT TRUE,
    covered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_geom ON routes USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_segments_midpoint ON route_segments USING GIST (midpoint_geom);
CREATE INDEX IF NOT EXISTS idx_run_points_geom ON route_run_points USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_run_points_run_id ON route_run_points(run_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
