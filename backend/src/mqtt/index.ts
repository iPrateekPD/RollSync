import mqtt from 'mqtt';
import { AttendanceService } from '../modules/attendance/attendance.service';
import { prisma } from '../config/prisma';
import { DeviceStatus } from '@prisma/client';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

export const setupMqtt = () => {
  const client = mqtt.connect(MQTT_BROKER_URL);

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
      if (parts.length !== 3) return;

      const [, classroomName, eventType] = parts;
      
      // Parse payload
      const payload = JSON.parse(message.toString());
      
      // Look up classroom
      const classroom = await prisma.classroom.findUnique({
        where: { name: classroomName },
        include: { device: true }
      });
      
      if (!classroom) return;

      // Update device heartbeat if applicable
      if (classroom.device) {
        await prisma.device.update({
          where: { id: classroom.device.id },
          data: {
            lastHeartbeat: new Date(),
            status: DeviceStatus.ONLINE,
            ...(payload.wifiRssi && { wifiRssi: payload.wifiRssi }),
            ...(payload.freeHeap && { freeHeap: payload.freeHeap })
          }
        });
      }

      const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

      switch (eventType) {
        case 'rfid':
          if (payload.uid) {
            await AttendanceService.processRfidEvent(classroom.id, payload.uid, timestamp);
          }
          break;
        case 'ble':
          if (payload.token && payload.rssi) {
            await AttendanceService.processBleObservation(classroom.id, payload.token, payload.rssi, timestamp);
          }
          break;
        case 'heartbeat':
          // Already handled above
          break;
        default:
          console.warn(`Unknown MQTT topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing MQTT message on topic ${topic}:`, error);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT Client Error:', err);
  });

  return client;
};
