#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// MQTT Configuration
#define MQTT_SERVER "broker.hivemq.com" // Replace with your MQTT broker IP
#define MQTT_PORT 1883
#define MQTT_USER "your_mqtt_user"
#define MQTT_PASSWORD "your_mqtt_password"
#define MQTT_CLIENT_ID "ESP32_RollSync_01"

// RollSync Topic Configuration
#define CLASSROOM_ID "Room-101"
#define TOPIC_RFID "attendance/" CLASSROOM_ID "/esp32/rfid"
#define TOPIC_BLE "attendance/" CLASSROOM_ID "/esp32/ble"
#define TOPIC_HEARTBEAT "attendance/" CLASSROOM_ID "/esp32/heartbeat"
#define TOPIC_STATUS "attendance/" CLASSROOM_ID "/esp32/status"

// Hardware Pins (ESP32-S3)
// RFID RC522 (SPI)
#define SS_PIN 10
#define RST_PIN 14
#define SCK_PIN 12
#define MOSI_PIN 11
#define MISO_PIN 13

// OLED (I2C)
#define OLED_SDA 8
#define OLED_SCL 9

#endif
