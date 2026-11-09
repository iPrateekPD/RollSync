# RollSync — MQTT Contract

> **Purpose:** Define device-to-backend messaging.  
> **Last updated:** 10 November 2026  
> **Protocol status:** Contract and inspected firmware are not yet fully aligned.

## 1. Overview

The ESP32-S3 firmware uses PubSubClient and MQTT. MQTT is intended to carry RFID events, BLE observations, device heartbeat/status, and backend acknowledgements or commands.

The existing contract defines this topic hierarchy:

`school/att/devices/{deviceId}/...`

However, the inspected firmware publishes using topic constants from `config.h`, and its RFID payload currently contains `type`, `uid`, and `timestamp`. The older API reference instead documents `classroom/+/rfid` and `classroom/+/status`.

**Do not assume these topic sets are interchangeable.** The backend subscription and firmware constants must be compared and aligned before the contract is considered operational.

## 2. Contract topic hierarchy (documented target)

### Device to broker/backend

| Topic pattern | QoS | Retained | Purpose |
|---|---:|---|---|
| `school/att/devices/{deviceId}/evt` | 1 | No | RFID taps and BLE batch events |
| `school/att/devices/{deviceId}/hb` | 0 | No | Device heartbeat, intended every 30 seconds |
| `school/att/devices/{deviceId}/status` | 1 | Yes | Online/offline status and Last Will |

### Backend to device

| Topic pattern | QoS | Retained | Purpose |
|---|---:|---|---|
| `school/att/devices/{deviceId}/ack` | 1 | No | Per-event acknowledgement |
| `school/att/devices/{deviceId}/cmd` | 1 | No | Configuration/session/time commands |

These are the topic patterns in the supplied contract. Confirm that the firmware and backend actually use them before deployment.

## 3. Documented target payloads

### 3.1 RFID tap event

Topic: `school/att/devices/{deviceId}/evt`

```json
{
  "type": "rfid_tap",
  "eventId": "7f3a-example",
  "deviceId": "ESP32-CR01-A3F2",
  "uid": "04:A3:1B:F2",
  "bootId": 4821,
  "ts": "2026-09-05T09:01:12Z"
}
```

### 3.2 BLE batch event

Topic: `school/att/devices/{deviceId}/evt`

```json
{
  "type": "ble_batch",
  "eventId": "7f3b-example",
  "deviceId": "ESP32-CR01-A3F2",
  "epoch": 1938,
  "ts": "2026-09-05T09:40:00Z",
  "obs": [
    {
      "token": "hashed-or-rotating-token",
      "rssi": -64,
      "count": 23
    }
  ]
}
```

The original contract example included a BLE MAC address. Avoid transmitting stable device identifiers or personal data unless the privacy design explicitly requires it and appropriate consent/security controls exist.

### 3.3 Acknowledgement

Topic: `school/att/devices/{deviceId}/ack`

```json
{
  "type": "ack",
  "eventId": "7f3a-example",
  "result": "OK_CHECKED_IN",
  "display": "WELCOME STUDENT",
  "beep": "success"
}
```

Documented result values:
- `OK_CHECKED_IN`
- `UNKNOWN_CARD`
- `NO_ACTIVE_SESSION`
- `DUPLICATE`
- `LATE_CHECKIN`
- `ERROR`

These values are part of the proposed contract and must be validated against backend and firmware handlers.

### 3.4 Heartbeat

Topic: `school/att/devices/{deviceId}/hb`

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

The inspected firmware currently publishes a heartbeat containing `status`, `uptime`, and `freeHeap` to a configured topic every 30 seconds. It does not show all fields from this richer example.

### 3.5 Device status

The inspected firmware publishes retained online/offline status using its configured status topic and a Last Will. The exact JSON format should be standardized with the backend.

## 4. Firmware payload currently observed

The inspected `firmware/src/main.cpp` currently creates an RFID JSON payload similar to:

```json
{
  "type": "rfid",
  "uid": "04A31BF2",
  "timestamp": 123456
}
```

The timestamp is based on `millis()` in the inspected source, not an ISO-8601 UTC timestamp.

The inspected BLE callback publishes a payload similar to:

```json
{
  "type": "ble",
  "deviceId": "AA:BB:CC:DD:EE:FF",
  "rssi": -64,
  "timestamp": 123456
}
```

The heartbeat currently resembles:

```json
{
  "status": "ok",
  "uptime": 123,
  "freeHeap": 180000
}
```

These are descriptions of the source observed, not proof that the backend accepts them.

## 5. Required protocol alignment

Before calling the MQTT integration complete, align the following:

| Item | Firmware source observed | Contract target | Required decision |
|---|---|---|---|
| RFID topic | `TOPIC_RFID` from config | `/evt` | Set one canonical topic. |
| RFID type | `rfid` | `rfid_tap` | Standardize event type. |
| Event ID | Not visible in inspected payload | Required `eventId` | Add stable idempotency key if contract retained. |
| Device ID | Not visible in inspected RFID payload | Required `deviceId` | Include or derive safely from authenticated connection. |
| Timestamp | `millis()` | ISO-8601 `ts` | Add NTP/RTC or define server receipt timestamp semantics. |
| BLE type | `ble` per observation | `ble_batch` | Decide if BLE is individual or batched. |
| Heartbeat | `status`, `uptime`, `freeHeap` | richer heartbeat | Standardize fields. |
| ACK receive | No callback visible in inspected source | `/ack` | Implement/verify subscription and callback. |

## 6. Reliability and security rules

The original contract proposes:

- QoS 1 for event, status, acknowledgement, and command messages.
- QoS 0 for heartbeat.
- Unique event IDs for idempotent processing.
- Retained online/offline status with Last Will.
- Persistent sessions where supported and configured.
- Per-device MQTT credentials and broker ACLs.
- No unnecessary personal data in messages.

Verify PubSubClient capabilities and the actual broker configuration before claiming persistent session or queued offline delivery behavior. Client-library and broker behavior must match the selected MQTT protocol version and configuration.

## 7. Backend processing expectations

For an RFID event, the backend should:

1. Authenticate/identify the publishing device.
2. Validate topic and payload.
3. Normalize the UID.
4. Resolve the UID against an active `rfid_cards` record.
5. Identify the active attendance session for the device/classroom.
6. Detect duplicate event IDs and repeated scans.
7. Persist the event in `rfid_events`.
8. Associate the event with student/session where possible.
9. Apply attendance rules.
10. Publish an acknowledgement if implemented.

## 8. Related documentation

- [Architecture](ARCHITECTURE.md)
- [Hardware setup](HARDWARE_SETUP.md)
- [API reference](API_REFERENCE.md)
- [Database schema](DATABASE_SCHEMA.md)
