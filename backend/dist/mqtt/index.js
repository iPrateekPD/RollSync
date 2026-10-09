"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMqtt = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
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
            // Phase 2: Pure MQTT ingestion logging
            if (eventType === 'rfid') {
                const timestamp = payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString();
                console.log('\n==========================================');
                console.log('ROLLSYNC MQTT EVENT');
                console.log('==========================================');
                console.log(`Topic : ${topic}`);
                console.log(`UID   : ${payload.uid || 'UNKNOWN'}`);
                console.log(`Name  : ${payload.name || 'UNKNOWN'}`);
                console.log(`Time  : ${timestamp}`);
                console.log('==========================================\n');
            }
            /* Phase 3+ Database Logic Temporarily Disabled
            // Look up classroom
            const classroom = await prisma.classroom.findUnique({
              where: { name: classroomName },
              include: { device: true }
            });
            ...
            */
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
