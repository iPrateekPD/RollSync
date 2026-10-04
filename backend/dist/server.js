"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.io = void 0;
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const mqtt_1 = require("./mqtt");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.io
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    }
});
exports.io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
exports.prisma = new client_1.PrismaClient();
// Initialize MQTT
const mqttClient = (0, mqtt_1.setupMqtt)();
async function bootstrap() {
    try {
        await exports.prisma.$connect();
        console.log('Database connected successfully');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
bootstrap();
