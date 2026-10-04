# OLED Display Hardware Test

This is an isolated ESP32 test firmware for verifying your 128x64 I2C OLED display. Since it wasn't working, testing it in isolation is the best way to debug it.

## Default Wiring Map
The standard I2C pins for the ESP32-WROOM-32U are used in this test:

| OLED Pin | ESP32 Pin |
|----------|-----------|
| VCC      | 3.3V      |
| GND      | GND       |
| SDA      | GPIO 21   |
| SCL      | GPIO 22   |

**If you wired SDA and SCL to different pins, you MUST update `#define I2C_SDA` and `#define I2C_SCL` in `src/main.cpp` before uploading!**

## Troubleshooting Steps

1. **Check 3.3V Power**: The OLED must receive 3.3V. If you accidentally plugged it into 5V (or Vin), it might be damaged, but usually they tolerate it. Stick to 3.3V.
2. **Double check SDA vs SCL**: A very common mistake is swapping SDA and SCL. SDA must go to SDA (21), SCL must go to SCL (22).
3. **I2C Address**: Most of these displays use the `0x3C` I2C address, which is configured in the code. Some rare displays use `0x3D`. If you see "SSD1306 allocation failed" in the Serial Monitor, try changing `0x3C` to `0x3D` in `main.cpp`.
4. **Serial Monitor**: Open the Serial Monitor (115200 baud). It will explicitly tell you if the display was detected or not.

## Upload Instructions
1. Open the `/firmware/oled_test` folder in Visual Studio Code.
2. Click the "PlatformIO: Upload" button.
