import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import departmentRoutes from './modules/departments/departments.routes';
import programRoutes from './modules/programs/programs.routes';
import studentRoutes from './modules/students/students.routes';
import teacherRoutes from './modules/teachers/teachers.routes';
import courseRoutes from './modules/courses/courses.routes';
import classroomRoutes from './modules/classrooms/classrooms.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import classSessionRoutes from './modules/class-sessions/class-sessions.routes';
import academicRoutes from './modules/academic/academic.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import erpReferenceRoutes from './modules/erp-reference/erp.routes';
import noticesRoutes from './modules/notices/notices.routes';
import leavesRoutes from './modules/leaves/leaves.routes';
import erpRoutes from './modules/erp/erp.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pino());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/programs', programRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/teachers', teacherRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/classrooms', classroomRoutes);
apiRouter.use('/timetable', timetableRoutes);
apiRouter.use('/class-sessions', classSessionRoutes);
apiRouter.use('/academic', academicRoutes);
apiRouter.use('/attendance-engine', attendanceRoutes); // renamed to avoid conflict if necessary? Wait.
apiRouter.use(erpReferenceRoutes); // Mounts /attendance, /exams, /exam-subjects
apiRouter.use('/notices', noticesRoutes);
apiRouter.use('/leaves', leavesRoutes);
apiRouter.use('/erp', erpRoutes);

app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
