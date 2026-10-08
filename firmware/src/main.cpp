#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

#include "config.h"

// OLED setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// RFID setup
SPIClass rfidSPI(FSPI);
MFRC522 mfrc522(&rfidSPI, SS_PIN, RST_PIN);

// WiFi & MQTT setup
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// BLE setup
BLEScan* pBLEScan;
int scanTime = 5; // In seconds
bool isScanning = false;

// Timers
unsigned long lastHeartbeat = 0;
unsigned long lastBleScan = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000;
const unsigned long BLE_SCAN_INTERVAL = 10000;

// State tracking
bool oledReady = false;

void setupOLED() {
  Wire.begin(OLED_SDA, OLED_SCL);
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    oledReady = false;
  } else {
    oledReady = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0,0);
    display.println("RollSync Booting...");
    display.display();
  }
}

void displayStatus(String msg) {
  if (!oledReady) return;
  display.clearDisplay();
  display.setCursor(0,0);
  display.println("RollSync " CLASSROOM_ID);
  display.println(WiFi.status() == WL_CONNECTED ? "Wi-Fi: OK" : "Wi-Fi: ERR");
  display.println(mqttClient.connected() ? "MQTT: OK" : "MQTT: ERR");
  display.println();
  display.println(msg);
  display.display();
}

void setupWiFi() {
  displayStatus("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  displayStatus("WiFi connected!");
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    displayStatus("Connecting to MQTT...");
    // Create LWT payload
    String lwtPayload = "{\"status\":\"offline\",\"reason\":\"lwt\",\"timestamp\":";
    lwtPayload += String(millis()) + "}";
    
    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASSWORD, TOPIC_STATUS, 1, true, lwtPayload.c_str())) {
      Serial.println("MQTT connected");
      // Send online status
      String onlinePayload = "{\"status\":\"online\",\"timestamp\":";
      onlinePayload += String(millis()) + "}";
      mqttClient.publish(TOPIC_STATUS, onlinePayload.c_str(), true);
      
      displayStatus("Ready!");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
      // In a real scenario, we check if it's a RollSync beacon (UUID filter)
      // For now, we report any device with a specific prefix or just print
      String address = advertisedDevice.getAddress().toString().c_str();
      int rssi = advertisedDevice.getRSSI();
      
      // Let's assume student beacons have a specific service UUID or name 
      // For demo, we just forward all or filter locally.
      // E.g., if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(BLEUUID("YOUR_UUID"))) { ... }

      // We'll publish the BLE payload to MQTT
      if (mqttClient.connected()) {
        JsonDocument doc;
        doc["type"] = "ble";
        doc["deviceId"] = address;
        doc["rssi"] = rssi;
        doc["timestamp"] = millis(); // Ideally use NTP time
        
        char buffer[256];
        serializeJson(doc, buffer);
        mqttClient.publish(TOPIC_BLE, buffer);
      }
    }
};

void setup() {
  Serial.begin(115200);
  
  setupOLED();
  setupWiFi();

  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  
  // Setup RFID (Custom SPI pins)
  rfidSPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  mfrc522.PCD_Init();
  Serial.println("RFID Ready");

  // Setup BLE
  BLEDevice::init("RollSync-Scanner");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks(), false); // false = non-blocking callback
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99); 
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();

  // Heartbeat
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = currentMillis;
    JsonDocument doc;
    doc["status"] = "ok";
    doc["uptime"] = currentMillis / 1000;
    doc["freeHeap"] = ESP.getFreeHeap();
    
    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(TOPIC_HEARTBEAT, buffer);
  }

  // BLE Scan scheduling
  if (currentMillis - lastBleScan >= BLE_SCAN_INTERVAL) {
    lastBleScan = currentMillis;
    pBLEScan->start(scanTime, nullptr, false); // async scan
  }

  // RFID Poll
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    Serial.println("RFID Tapped: " + uid);
    displayStatus("Tapped:\n" + uid);

    JsonDocument doc;
    doc["type"] = "rfid";
    doc["uid"] = uid;
    doc["timestamp"] = millis(); // Ideally NTP time

    char buffer[256];
    serializeJson(doc, buffer);
    mqttClient.publish(TOPIC_RFID, buffer);

    delay(2000); // Prevent duplicate reads immediately
    displayStatus("Ready!");
  }
}
