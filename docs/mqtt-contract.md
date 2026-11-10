# RollSync MQTT Contract

This contract covers the current ESP32-S3 classroom RFID reader and backend demo workflow.

## Broker configuration

Set these on the persistent Node backend:
- `MQTT_BROKER_URL`: broker URL (prefer authenticated TLS, e.g. `mqtts://...`)
- `MQTT_USERNAME` and `MQTT_PASSWORD`: broker credentials
- `MQTT_RFID_TOPIC_FILTER`: defaults to `attendance/+/esp32/rfid`
- `MQTT_CLIENT_ID`: unique backend client identifier

The firmware currently has broker and Wi-Fi placeholders in `firmware/src/config.h`. Do not commit real credentials. The public, unauthenticated broker fallback is for temporary demos only.

## Classroom topic namespace

The current firmware classroom is `RDB-6`. Topic segments must match the normalized classroom name (spaces become hyphens).

| Purpose | Topic |
|---|---|
| RFID card taps | `attendance/RDB-6/esp32/rfid` |
| Backend reader control | `attendance/RDB-6/esp32/command` |
| Device heartbeat | `attendance/RDB-6/esp32/heartbeat` |
| Device status / LWT | `attendance/RDB-6/esp32/status` |
| BLE telemetry | `attendance/RDB-6/esp32/ble` |

## RFID tap payload

```json
{
  "type": "rfid",
  "uid": "264A1507",
  "timestamp": 123456
}
```

The current ESP32 payload timestamp is `millis()`, not wall-clock time. The backend therefore uses its receive time unless the device later sends an ISO-8601 timestamp. UID is normalized to uppercase hexadecimal before card lookup.

## Reader control command

Backend publishes to the command topic:

```json
{
  "command": "rfid",
  "enabled": true,
  "issued_at": "2026-11-10T05:30:00.000Z"
}
```

- `enabled: true`: allow RC522 polling during a running class.
- `enabled: false`: pause RC522 polling outside a class and after completion.
- QoS 1 and retained state are used so a reconnecting ESP32 receives the latest reader state.

## Demo event processing

1. Backend subscribes to `attendance/+/esp32/rfid`.
2. It finds the active `demo_class_sessions` row matching the classroom and current time.
3. It resolves UID through active `rfid_cards`.
4. It checks that the card holder is in that session's roster.
5. It stores the tap in `demo_class_rfid_events`; this table is intentionally separate from legacy `rfid_events`, whose session foreign key points to `attendance_sessions`.
6. Outside a demo class, the existing `AttendanceService.processRfidTap` flow remains in place.

## Demo attendance evidence

- RFID tap + face match in at least 3 successful frames: AI suggests Present.
- RFID only, face only, or no evidence: Needs Review.
- The teacher must explicitly choose Present or Absent for every student before final confirmation.
- Camera non-detection is not proof of absence.

## Deployment notes

The backend must run as a persistent service with MQTT connectivity. Keep the broker private/authenticated and use TLS in production. Configure the ESP32 and backend with the same classroom identifier and broker. A classroom selection in the dashboard cannot control a differently configured physical device until device-to-room provisioning is implemented.
