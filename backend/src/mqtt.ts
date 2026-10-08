import mqtt from 'mqtt';
import { AttendanceService } from './services/attendanceService';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'classroom/RDB-6/rfid';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `rollsync-backend-${Math.random().toString(16).slice(2, 8)}`;

export const setupMqtt = () => {
  console.log('[MQTT] Connecting...');
  
  const client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: MQTT_CLIENT_ID,
    reconnectPeriod: 1000 * 5, // 5 seconds
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log(`[MQTT] Subscribed to ${MQTT_TOPIC}`);
      } else {
        console.error(`[MQTT] Failed to subscribe to ${MQTT_TOPIC}`, err);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      if (topic !== MQTT_TOPIC) return;
      
      const payloadStr = message.toString();
      
      // Parse JSON safely
      let payload;
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        console.error(`[MQTT] Malformed JSON: ${payloadStr}`);
        return;
      }

      let { uid, name, timestamp } = payload;

      // Validate UID
      if (!uid || typeof uid !== 'string') {
        console.warn(`[MQTT] Invalid or missing UID in payload`);
        return;
      }
      
      uid = uid.trim().toUpperCase();
      if (uid.length === 0) {
        console.warn(`[MQTT] Empty UID in payload`);
        return;
      }

      // Timestamp fallback
      const eventTimestamp = timestamp && typeof timestamp === 'string' 
        ? new Date(timestamp).toISOString() 
        : new Date().toISOString();

      // Device resolution (hardcoded classroom based on topic for now, or extracted from topic)
      // Example topic: classroom/RDB-6/rfid
      const parts = topic.split('/');
      const deviceClassroom = parts[1] || 'RDB-6';
      const deviceIdStr = `RollSync-${deviceClassroom}-01`;

      // Update Device Status
      await AttendanceService.updateDeviceStatus(deviceIdStr, 'online');

      // Process tap
      await AttendanceService.processRfidTap(uid, deviceClassroom, deviceIdStr, eventTimestamp);

    } catch (error) {
      console.error(`[MQTT] Error processing message on topic ${topic}:`, error);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Connection Error:', err);
  });

  client.on('offline', () => {
    console.warn('[MQTT] Client is offline');
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting...');
  });

  return client;
};
