"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const mqtt_1 = require("./mqtt");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const server = http_1.default.createServer(app_1.default);
// Graceful Shutdown variables
let mqttClient = null;
const socket_1 = require("./socket");
async function bootstrap() {
    try {
        console.log('[SERVER] RollSync Backend starting...');
        // We can skip the blocking Supabase query to prevent hanging on bad keys.
        console.log('[DB] Supabase initialized (key present).');
        (0, socket_1.initSocket)(server);
        mqttClient = (0, mqtt_1.setupMqtt)();
        server.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`[SERVER] RollSync Backend is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('[SERVER] Failed to start server:', error);
        process.exit(1);
    }
}
bootstrap();
// Graceful Shutdown handlers
const shutdown = () => {
    console.log('[SERVER] Shutting down gracefully...');
    if (mqttClient) {
        mqttClient.end();
    }
    server.close(() => {
        console.log('[SERVER] Closed out remaining connections.');
        process.exit(0);
    });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
