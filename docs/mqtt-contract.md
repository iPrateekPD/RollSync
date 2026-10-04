# MQTT Contract & Payload Specification

## 1. Topic Hierarchy
All topics use a single-tenant prefix: `school/att`

### UPLINK (Device -> Broker)
| Topic | QoS | Retained | Purpose |
|-------|-----|----------|---------|
| `school/att/devices/{deviceId}/evt` | 1 | No | RFID taps + BLE batch observations |
| `school/att/devices/{deviceId}/hb` | 0 | No | Heartbeat (every 30s) |
| `school/att/devices/{deviceId}/status` | 1 | Yes | LWT online/offline status |

### DOWNLINK (Broker/Backend -> Device)
| Topic | QoS | Retained | Purpose |
|-------|-----|----------|---------|
| `school/att/devices/{deviceId}/ack` | 1 | No | Per-event ack (drives LED/OLED/Buzzer) |
| `school/att/devices/{deviceId}/cmd` | 1 | No | Config, session start/stop, time sync |

---

## 2. Example Payloads

### RFID Tap Uplink (`evt` topic)
```json
{
  "type": "rfid_tap",
  "eventId": "7f3a...",
  "deviceId": "ESP32-CR01-A3F2",
  "uid": "04:A3:1B:F2",
  "bootId": 4821,
  "ts": "2026-09-05T09:01:12Z"
}
```

### BLE Batch Uplink (`evt` topic)
Sent every 15 seconds containing passive scans, deduped per identity.
```json
{
  "type": "ble_batch",
  "eventId": "7f3b...",
  "deviceId": "ESP32-CR01-A3F2",
  "epoch": 1938,
  "ts": "2026-09-05T09:40:00Z",
  "obs": [
    {
      "token": "a91f...",
      "mac": "C4:7C:8D:11:22:33",
      "rssi": -64,
      "count": 23
    },
    {
      "token": "b204...",
      "mac": "E4:...",
      "rssi": -81,
      "count": 9
    }
  ]
}
```

### Acknowledgment Downlink (`ack` topic)
```json
{
  "type": "ack",
  "eventId": "7f3a...",
  "result": "OK_CHECKED_IN",
  "display": "WELCOME ANANYA",
  "beep": "success"
}
```
*Results can be: `OK_CHECKED_IN` \| `UNKNOWN_CARD` \| `NO_ACTIVE_SESSION` \| `DUPLICATE` \| `LATE_CHECKIN` \| `ERROR`*

### Heartbeat Uplink (`hb` topic)
```json
{
  "deviceId": "ESP32-CR01-A3F2",
  "uptimeS": 12834,
  "freeHeap": 182300,
  "wifiRssi": -58,
  "fw": "1.2.0",
  "ip": "10.0.4.21",
  "ts": "2026-09-05T09:01:12Z"
}
```

---

## 3. Design Rules
- **QoS 1 everywhere except heartbeat (QoS 0)**: matches "QoS 1 + idempotency key" best practice.
- **Every uplink event carries `eventId`**: Backend dedups on `event_id` unique -> replay after outage is safe.
- **ESP32 connects with `cleanSession=false`**: so offline cmd/ack messages queue on the broker.
- **LWT = retained status:"offline" on status topic**: connect publishes retained status:"online".
- **Batch BLE observations every 15 s**: into one `evt` message (`type ble_batch`) instead of 40 messages/sec.
- **Authentication**: per-device `mqtt_username = deviceId`, password from device provisioning. ACL restricts publish/subscribe.
- **Never put raw PII in payloads**: send `uid` + hashed/rotating BLE token, not student names.
