"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMqtt = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const attendance_service_1 = require("../modules/attendance/attendance.service");
const server_1 = require("../server");
const client_1 = require("@prisma/client");
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const setupMqtt = () => {
    const client = mqtt_1.default.connect(MQTT_BROKER_URL);
    client.on('connect', () => {
        console.log(`Connected to MQTT broker at ${MQTT_BROKER_URL}`);
        // Subscribe to all classroom topics. Assuming topic structure: classroom/{classroomId}/#
        // Examples: 
        // classroom/CSB-5/rfid
        // classroom/CSB-5/ble
        // classroom/CSB-5/heartbeat
        client.subscribe('classroom/+/rfid');
        client.subscribe('classroom/+/ble');
        client.subscribe('classroom/+/heartbeat');
    });
    client.on('message', async (topic, message) => {
        try {
            const parts = topic.split('/');
            if (parts.length !== 3)
                return;
            const [, classroomName, eventType] = parts;
            // Parse payload
            const payload = JSON.parse(message.toString());
            // Look up classroom
            const classroom = await server_1.prisma.classroom.findUnique({
                where: { name: classroomName },
                include: { device: true }
            });
            if (!classroom)
                return;
            // Update device heartbeat if applicable
            if (classroom.device) {
                await server_1.prisma.device.update({
                    where: { id: classroom.device.id },
                    data: {
                        lastHeartbeat: new Date(),
                        status: client_1.DeviceStatus.ONLINE,
                        ...(payload.wifiRssi && { wifiRssi: payload.wifiRssi }),
                        ...(payload.freeHeap && { freeHeap: payload.freeHeap })
                    }
                });
            }
            const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
            switch (eventType) {
                case 'rfid':
                    if (payload.uid) {
                        await attendance_service_1.AttendanceService.processRfidEvent(classroom.id, payload.uid, timestamp);
                    }
                    break;
                case 'ble':
                    if (payload.token && payload.rssi) {
                        await attendance_service_1.AttendanceService.processBleObservation(classroom.id, payload.token, payload.rssi, timestamp);
                    }
                    break;
                case 'heartbeat':
                    // Already handled above
                    break;
                default:
                    console.warn(`Unknown MQTT topic: ${topic}`);
            }
        }
        catch (error) {
            console.error(`Error processing MQTT message on topic ${topic}:`, error);
        }
    });
    client.on('error', (err) => {
        console.error('MQTT Client Error:', err);
    });
    return client;
};
exports.setupMqtt = setupMqtt;
