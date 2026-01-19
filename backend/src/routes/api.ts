import { Router } from 'express';
import * as routeController from '../controllers/routeController';
import * as runController from '../controllers/runController';
import * as userController from '../controllers/userController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Routes Management
router.get('/routes', routeController.getRoutes);
router.get('/routes/:id', routeController.getRouteById);
router.post('/routes/upload', upload.single('file'), routeController.uploadRoute);
router.post('/routes', routeController.createRoute);
router.delete('/routes/:id', routeController.deleteRoute);

// Users & Assignments
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.post('/assignments', userController.assignRoute);
router.get('/assignments/:userId', userController.getUserAssignments);

// Route Runs
router.post('/runs/start', runController.startRun);
router.post('/runs/point', runController.savePoint);
router.post('/runs/end', runController.endRun);
router.get('/runs', runController.getRuns);
router.get('/runs/:id', runController.getRunDetails);

export default router;
