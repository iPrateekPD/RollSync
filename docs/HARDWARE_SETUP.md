# Hardware Setup (ESP32 Node)

The RollSync hardware client relies on the ESP32 and MFRC522 modules to detect ID cards and transmit data via MQTT.

## Wiring Diagram

| ESP32 Pin | MFRC522 Pin | Function       |
|-----------|-------------|----------------|
| 3V3       | 3.3V        | Power          |
| GND       | GND         | Ground         |
| D18       | SCK         | SPI Clock      |
| D19       | MISO        | SPI MISO       |
| D23       | MOSI        | SPI MOSI       |
| D5        | SDA / SS    | SPI Chip Select|
| D22       | RST         | Reset          |

### Feedback Peripherals
- **Green LED:** Pin D2 (Success)
- **Red LED:** Pin D4 (Error / Invalid)
- **Buzzer:** Pin D15 (Audible confirmation)

## Configuration
Before flashing the firmware, configure `src/main.cpp` with the networking details:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "broker.hivemq.com";
```

## PlatformIO
Build and upload the project using PlatformIO CLI or the VS Code Extension:
```bash
pio run --target upload
```
