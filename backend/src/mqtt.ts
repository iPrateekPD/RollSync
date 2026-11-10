import mqtt, { MqttClient } from 'mqtt';
import { AttendanceService } from './services/attendanceService';
import { prisma } from './config/prisma';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io:1883';
const RFID_TOPIC_FILTER = process.env.MQTT_RFID_TOPIC_FILTER || 'attendance/+/esp32/rfid';
const MQTT_CLIENT_ID = process.env.MQTT_CLIENT_ID || `rollsync-backend-${Math.random().toString(16).slice(2, 8)}`;

let mqttClient: MqttClient | null = null;

const safeRoom = (room: string) => room.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
export const publishRfidControl = (classroom: string, enabled: boolean) => {
  if (!mqttClient?.connected) throw new Error('MQTT broker is not connected; RFID control was not sent.');
  const topic = `attendance/${safeRoom(classroom)}/esp32/command`;
  const payload = JSON.stringify({ command: 'rfid', enabled, issued_at: new Date().toISOString() });
  mqttClient.publish(topic, payload, { qos: 1, retain: true });
};

export const setupMqtt = () => {
  console.log('[MQTT] Connecting...');
  const client = mqtt.connect(MQTT_BROKER_URL, {
    clientId: MQTT_CLIENT_ID,
    reconnectPeriod: 5000,
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
  });
  mqttClient = client;

  client.on('connect', () => {
    console.log('[MQTT] Connected');
    client.subscribe(RFID_TOPIC_FILTER, { qos: 1 }, err => {
      if (err) console.error('[MQTT] RFID subscription failed', err);
      else console.log(`[MQTT] Subscribed to ${RFID_TOPIC_FILTER}`);
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payloadStr = message.toString();
      let payload: any;
      try { payload = JSON.parse(payloadStr); }
      catch { console.warn('[MQTT] Ignoring malformed JSON'); return; }
      const uid = typeof payload.uid === 'string' ? payload.uid.trim().toUpperCase() : '';
      if (!uid || !/^[A-F0-9]{4,20}$/.test(uid)) return;

      const parts = topic.split('/');
      const classroom = parts.length === 4 ? parts[1] : '';
      if (!classroom) return;
      const now = new Date();
      const timestamp = typeof payload.timestamp === 'string' && !Number.isNaN(Date.parse(payload.timestamp))
        ? new Date(payload.timestamp) : now;

      // Demo taps are recorded against the active demo session, independently of legacy attendance_sessions.
      const activeDemo = await prisma.demo_class_sessions.findFirst({
        where: { classroom, status: 'in_progress', started_at: { lte: now }, ended_at: { gt: now } },
        orderBy: { started_at: 'desc' },
      });
      if (activeDemo) {
        const card = await prisma.rfid_cards.findFirst({
          where: { uid, active: true },
          include: { students: true },
        });
        const student = card?.students;
        const rosterEntry = student ? await prisma.demo_class_roster.findUnique({
          where: { session_id_student_id: { session_id: activeDemo.id, student_id: student.id } },
        }) : null;
        await prisma.demo_class_rfid_events.create({
          data: {
            session_id: activeDemo.id,
            uid,
            student_id: rosterEntry ? student!.id : null,
            student_name_snapshot: rosterEntry ? student!.name : null,
            classroom,
            event_timestamp: timestamp,
            mqtt_topic: topic,
            raw_payload: payload,
            processing_status: rosterEntry ? 'matched' : 'unmatched',
            review_reason: !card ? 'Unregistered RFID card' : !rosterEntry ? 'Card holder is not in this class roster' : null,
          },
        });
        return;
      }

      // Preserve the existing attendance pipeline outside the demo flow.
      const deviceClassroom = classroom;
      const deviceIdStr = `RollSync-${deviceClassroom}-01`;
      await AttendanceService.updateDeviceStatus(deviceIdStr, 'online');
      await AttendanceService.processRfidTap(uid, deviceClassroom, deviceIdStr, timestamp.toISOString(), topic, payloadStr);
    } catch (error) {
      console.error(`[MQTT] Error processing message on ${topic}:`, error);
    }
  });

  client.on('error', err => console.error('[MQTT] Connection Error:', err));
  client.on('offline', () => console.warn('[MQTT] Client is offline'));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
  return client;
};
