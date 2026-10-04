# RollSync - RFID & LED Hardware Test

This is a minimal ESP32 test firmware for verifying the hardware components of the RollSync system.

## Hardware Configuration
* **Microcontroller:** ESP32 (specifically ESP32-WROOM-32U based on project blueprint)
* **Board Configuration (PlatformIO):** `esp32dev`

## Wiring Map

### RC522 RFID Reader
| RC522 Pin | ESP32 Pin |
|-----------|-----------|
| VCC       | 3.3V      |
| GND       | GND       |
| SDA/SS    | GPIO 10   |
| SCK       | GPIO 12   |
| MOSI      | GPIO 11   |
| MISO      | GPIO 13   |
| RST       | GPIO 14   |

### Status LEDs
| Component | ESP32 Pin | Connection |
|-----------|-----------|------------|
| Green LED | GPIO 4    | Pin -> 220Ω Resistor -> LED Anode (+) -> GND |
| Red LED   | GPIO 5    | Pin -> 220Ω Resistor -> LED Anode (+) -> GND |

## Required Library
* **MFRC522** by GithubCommunity (installed automatically via PlatformIO)

## Upload Instructions
1. Open this `rfid_led_test` folder in Visual Studio Code with the PlatformIO extension installed.
2. Connect your ESP32 to your computer via USB.
3. Click the "PlatformIO: Upload" button (right arrow icon) at the bottom taskbar, or run:
   ```bash
   pio run --target upload
   ```

## Serial Monitor
* **Baud Rate:** `115200`
* After uploading, open the Serial Monitor to view the startup test and RFID scan results.

## Troubleshooting
* **Error during compilation:** Ensure that the PlatformIO extension is installed and initialized. The `platformio.ini` should correctly specify `esp32dev`.
* **"Firmware Version: 0x0" or "0xFF":** This indicates the ESP32 cannot communicate with the RC522. Double-check all SPI wiring (SDA, SCK, MOSI, MISO, RST) against the exact GPIO mapping above.
* **LEDs not lighting up:** Ensure the LEDs are oriented correctly (long leg / Anode to the GPIO pin via resistor, short leg / Cathode to GND).
* **Card not detected:** Some cards operate at different frequencies. Ensure you are using 13.56 MHz MIFARE Classic tags.
