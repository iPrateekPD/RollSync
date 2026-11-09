# RollSync — Hardware Setup

> **Target board in inspected PlatformIO configuration:** `esp32-s3-devkitc-1`  
> **Framework:** Arduino  
> **Last updated:** 10 November 2026

## 1. Hardware overview

The RollSync classroom device is designed around an ESP32-S3 microcontroller. The inspected firmware includes:

- MFRC522 RFID reader.
- SSD1306 OLED display.
- Wi-Fi connectivity.
- MQTT messaging through PubSubClient.
- BLE scanning.
- Periodic heartbeat publishing.

The firmware source initializes the OLED at I²C address `0x3C` and uses configurable pin constants from `config.h`.

## 2. Bill of materials

| Component | Purpose | Status from inspected source/history |
|---|---|---|
| ESP32-S3 development board | Main controller | Firmware target configured |
| MFRC522 module | RFID card reader | Driver included |
| RFID cards/tags | Student card identity | UID read by firmware |
| SSD1306 128×64 OLED | Device and scan status | Driver and initialization included |
| USB power/data cable | Programming and power | Required for setup |
| Wi-Fi network | Device connectivity | Firmware connects using config |
| MQTT broker access | Device messaging | PubSubClient included |
| Battery and charging circuit | Portable operation | Not verified as implemented |
| LEDs/buzzer | Optional scan feedback | Not present in inspected `main.cpp`; verify hardware branch before wiring |

## 3. PlatformIO configuration

The inspected `firmware/platformio.ini` contains:

```ini
[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
monitor_speed = 115200

lib_deps =
    knolleary/PubSubClient @ ^2.8
    miguelbalboa/MFRC522 @ ^1.4.11
    adafruit/Adafruit SSD1306 @ ^2.5.9
    adafruit/Adafruit GFX Library @ ^1.11.9
    bblanchon/ArduinoJson @ ^7.0.4
```

The firmware source also includes ESP32 BLE headers.

## 4. RFID wiring

The project’s previously tested ESP32-S3 pin mapping is:

| MFRC522 pin | ESP32-S3 GPIO | Function |
|---|---:|---|
| SDA / SS | GPIO 10 | SPI chip select |
| SCK | GPIO 12 | SPI clock |
| MOSI | GPIO 11 | SPI controller-to-reader |
| MISO | GPIO 13 | SPI reader-to-controller |
| RST | GPIO 14 | Reset |
| 3.3V | 3V3 | Power |
| GND | GND | Ground |

**Verification note:** The inspected firmware calls `rfidSPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN)` and constructs the MFRC522 driver using `SS_PIN` and `RST_PIN`. Confirm the exact values in `firmware/src/config.h` before wiring. The table above reflects the pin mapping recorded during previous project work, not a fresh electrical measurement.

Do not use the old generic ESP32 mapping (GPIO 18/19/23/5/22) for this ESP32-S3 setup without checking the board and source configuration.

## 5. OLED display

The inspected firmware configures:

- Display controller: SSD1306.
- Resolution: 128 × 64.
- I²C address: `0x3C`.
- Driver: Adafruit SSD1306 + Adafruit GFX.
- I²C pins: `OLED_SDA` and `OLED_SCL` from `config.h`.

The project previously detected I²C address `0x3C` using an I²C scanner.

The current firmware displays boot, Wi-Fi, MQTT, and RFID UID/status messages. The requested feature to display the matched cardholder’s name requires a backend acknowledgement containing the name and a firmware MQTT callback that receives and renders that acknowledgement. This end-to-end behavior must be verified before being marked complete.

## 6. Firmware behavior observed in source

The inspected `firmware/src/main.cpp`:

1. Initializes serial at 115200 baud.
2. Initializes the OLED.
3. Connects to Wi-Fi using `WIFI_SSID` and `WIFI_PASSWORD`.
4. Configures MQTT using constants from `config.h`.
5. Initializes SPI and MFRC522.
6. Initializes BLE scanning.
7. Reconnects MQTT when disconnected.
8. Calls `mqttClient.loop()`.
9. Publishes a heartbeat every 30 seconds.
10. Starts BLE scans on a timer.
11. Polls for RFID cards and publishes a JSON message.
12. Displays the scanned UID on the OLED.

The inspected RFID payload contains `type`, `uid`, and `timestamp` (millis-based in the current source). It does not match every field in the richer MQTT contract.

## 7. Configuration and secrets

Firmware configuration is included from `config.h`.

Use local/private configuration for:
- Wi-Fi SSID.
- Wi-Fi password.
- MQTT host and port.
- MQTT username and password.
- Device/client identity.
- Classroom identity.
- GPIO assignments.

Do not commit credentials. If the repository uses a sample config file, keep placeholders in the tracked example and put actual credentials in an ignored local file.

## 8. Build and upload

From the repository root:

```bash
cd firmware
pio run
```

Upload to a connected board:

```bash
pio run --target upload
```

Open the serial monitor:

```bash
pio device monitor
```

Use 115200 baud, matching `monitor_speed`.

If using the VS Code PlatformIO extension:
1. Open the repository.
2. Open the `firmware` project.
3. Connect the ESP32-S3 over USB.
4. Build the project.
5. Upload firmware.
6. Open the serial monitor.

## 9. Hardware validation checklist

- [ ] Confirm exact board variant.
- [ ] Confirm `config.h` pin values.
- [ ] Verify 3.3V and GND wiring.
- [ ] Run I²C scanner and confirm OLED address.
- [ ] Confirm OLED startup screen.
- [ ] Confirm Wi-Fi connection.
- [ ] Confirm MQTT connection.
- [ ] Confirm MFRC522 version/register and UID reading.
- [ ] Confirm RFID event arrives at backend.
- [ ] Confirm backend acknowledgement returns to device.
- [ ] Confirm cardholder name display.
- [ ] Confirm heartbeat visibility.
- [ ] Confirm BLE scan behavior if BLE remains in scope.
- [ ] Test disconnect/reconnect behavior.
- [ ] Test power stability and long-duration operation.

## 10. Troubleshooting

| Symptom | Checks |
|---|---|
| RFID reader not detected | Verify 3.3V, GND, SPI pin mapping, SS/RST, and board-specific SPI setup. |
| OLED blank | Verify SDA/SCL, address `0x3C`, display power, and I²C initialization. |
| Wi-Fi never connects | Check local config, 2.4 GHz network compatibility, credentials, and signal. |
| MQTT never connects | Check broker hostname, port, credentials, network access, and client ID uniqueness. |
| UID displays but backend sees nothing | Compare firmware topic and payload with backend subscription. |
| Student name does not appear | Verify backend acknowledgement publish, firmware subscription/callback, and display rendering. |
| Duplicate scans | Check polling/debounce behavior and backend idempotency. |
| Device repeatedly reboots | Check power supply, serial logs, heap usage, and BLE/RFID timing. |

## 11. Known limitations / pending verification

- Exact pin values must be checked in `config.h`.
- Firmware and MQTT contract payloads currently differ.
- The inspected firmware source does not show an MQTT acknowledgement subscription callback.
- NTP synchronization is not shown in the inspected `main.cpp`; current event timestamps use `millis()`.
- OTA support is not shown in the inspected `main.cpp`.
- Battery-powered operation is not verified.
- LED/buzzer wiring from older documentation is not supported by the inspected `main.cpp`; verify before connecting.
