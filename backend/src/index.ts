import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})); // Allow large payloads for GeoJSON upload
app.use(express.json({ limit: '50mb' })); // Allow large payloads for GeoJSON upload
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (req, res) => {
    res.send('Route Checking Tool API is running.');
});

// API Routes
app.use('/api', apiRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
