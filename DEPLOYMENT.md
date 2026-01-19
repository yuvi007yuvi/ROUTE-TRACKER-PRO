# Deployment Guide for Route Checking Tool

## 1. Database (Supabase)
1. Create a new Supabase project.
2. Go to the **SQL Editor**.
3. Open `database/schema.sql` from this repository.
4. Copy and paste the content into the SQL Editor and run it. This will:
   - Enable PostGIS extension.
   - Create all necessary tables (users, routes, runs, etc.).
5. Go to **Project Settings > API**.
   - Copy `Project URL` (SUPABASE_URL).
   - Copy `service_role` secret (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!** (For Backend).
   - Copy `anon` key (SUPABASE_ANON_KEY) - (For Frontend).

## 2. Backend (Render / Railway)
1. Create a new Web Service connected to your repo (e.g., `backend` folder).
2. Set the Build Command: `npm install && npm run build`
3. Set the Start Command: `npm start`
4. **Environment Variables**:
   - `PORT`: `5000`
   - `SUPABASE_URL`: (From Step 1)
   - `SUPABASE_SERVICE_ROLE_KEY`: (From Step 1)
5. Deploy.
6. Copy the deployed URL (e.g., `https://my-api.onrender.com`).

## 3. Frontend (Netlify / Vercel)
1. Create a new project connected to your repo (e.g., `frontend` folder).
2. Set the Build Command: `npm run build`
3. Set the Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`: (From Step 1)
   - `VITE_SUPABASE_ANON_KEY`: (From Step 1)
   - `VITE_API_URL`: `https://my-api.onrender.com/api` (The URL from Step 2)
5. Deploy.

## 4. Initial Setup
1. Use the Supabase Dashboard to insert a test Admin User into the `users` table:
   ```sql
   INSERT INTO users (name, email, role, zone) VALUES ('Admin', 'admin@example.com', 'admin', 'North');
   ```
2. Open the frontend URL, login with `admin@example.com`.
3. Go to Admin Dashboard -> Routes and try uploading a route.

## 5. Mobile Usage
- Field users should open the Frontend URL in their mobile browser (Chrome/Safari).
- Add to Home Screen to install as PWA.
- Ensure Location permissions are granted.
