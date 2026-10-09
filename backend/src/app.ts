import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Route imports
import healthRoutes from './routes/health';
import sessionsRoutes from './routes/sessions';
import studentsRoutes from './routes/students';

import authRoutes from './routes/auth';
import timetableRoutes from './routes/timetable';
import demoRoutes from './routes/demo';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' })); // JSON body size limits

// Routes
const apiRouter = express.Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/sessions', sessionsRoutes);
apiRouter.use('/students', studentsRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/timetable', timetableRoutes);
apiRouter.use('/demo', demoRoutes);

// Mock routes for definition of done
apiRouter.get('/attendance', (req, res) => res.json([]));
apiRouter.get('/attendance/today', (req, res) => res.json([]));
apiRouter.get('/devices', (req, res) => res.json([]));
apiRouter.get('/devices/:id', (req, res) => res.json({}));

app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER] Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
