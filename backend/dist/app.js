"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// Route imports
const health_1 = __importDefault(require("./routes/health"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const students_1 = __importDefault(require("./routes/students"));
const auth_1 = __importDefault(require("./routes/auth"));
const timetable_1 = __importDefault(require("./routes/timetable"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' })); // JSON body size limits
// Routes
const apiRouter = express_1.default.Router();
apiRouter.use('/health', health_1.default);
apiRouter.use('/sessions', sessions_1.default);
apiRouter.use('/students', students_1.default);
apiRouter.use('/auth', auth_1.default);
apiRouter.use('/timetable', timetable_1.default);
// Mock routes for definition of done
apiRouter.get('/attendance', (req, res) => res.json([]));
apiRouter.get('/attendance/today', (req, res) => res.json([]));
apiRouter.get('/devices', (req, res) => res.json([]));
apiRouter.get('/devices/:id', (req, res) => res.json({}));
app.use('/api', apiRouter);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[SERVER] Unhandled error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});
exports.default = app;
