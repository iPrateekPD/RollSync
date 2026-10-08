#include <Arduino.h>
#include <ArduinoOTA.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <WiFi.h>
#include <time.h>

// ============================================================
// RollSync — Intelligent Attendance & Presence Verification
// ESP32-S3 + RC522
//
// RC522:
// VCC  -> 3V3
// GND  -> GND
// SDA  -> GPIO 10  (SPI SS/CS)
// SCK  -> GPIO 12
// MOSI -> GPIO 11
// MISO -> GPIO 13
// RST  -> GPIO 14
// IRQ  -> Not connected
//
// NO OLED
// NO BUZZER
// ============================================================

// ============================================================
// RC522 SPI PINS
// ============================================================

#define SCK_PIN 12
#define MISO_PIN 13
#define MOSI_PIN 11
#define SS_PIN 10
#define RST_PIN 14

// ============================================================
// MQTT
// ============================================================

const char *MQTT_BROKER = "broker.emqx.io";
const uint16_t MQTT_PORT = 1883;

const char *MQTT_TOPIC = "classroom/RDB-6/rfid";

// ============================================================
// NTP
// ============================================================

const long GMT_OFFSET_SEC = 19800;
const int DAYLIGHT_OFFSET_SEC = 0;

const char *NTP_SERVER_1 = "pool.ntp.org";
const char *NTP_SERVER_2 = "time.nist.gov";

// ============================================================
// RFID
// ============================================================

const unsigned long RFID_COOLDOWN = 3000;

// ============================================================
// OBJECTS
// ============================================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);

MFRC522 rfid(SS_PIN, RST_PIN);

Preferences preferences;

// ============================================================
// VARIABLES
// ============================================================

String savedSSID = "";
String savedPassword = "";

String lastUID = "";

unsigned long lastRFIDTime = 0;

// ============================================================
// FUNCTION DECLARATIONS
// ============================================================

void connectWiFi();
void connectMQTT();
void setupOTA();
void setupTime();

String getUID();
String getCardName(String uid);
String getCurrentTimestamp();

void publishRFID(String uid, String name);

void forgetWiFi();

// ============================================================
// CARD UID → NAME
// ============================================================

String getCardName(String uid) {

  uid.toUpperCase();

  if (uid == "264A1507") {
    return "PD";
  }

  if (uid == "3F67F4B5") {
    return "Brajesh";
  }

  if (uid == "1FEEF5B5") {
    return "Ritwika";
  }

  if (uid == "5F91A6DD") {
    return "Nitesh";
  }

  if (uid == "3F97A7DD") {
    return "Subham";
  }

  if (uid == "3FAA03B6") {
    return "Pragyan";
  }

  return "Unknown Card";
}

// ============================================================
// GET UID
// ============================================================

String getUID() {

  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {

    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }

    uid += String(rfid.uid.uidByte[i], HEX);
  }

  uid.toUpperCase();

  return uid;
}

// ============================================================
// GET CURRENT TIMESTAMP
// ============================================================

String getCurrentTimestamp() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "TIME_NOT_SYNCED";
  }

  char buffer[30];

  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);

  return String(buffer);
}

// ============================================================
// WIFI
// ============================================================

void connectWiFi() {

  preferences.begin("wifi", false);

  savedSSID = preferences.getString("ssid", "");
  savedPassword = preferences.getString("password", "");

  preferences.end();

  if (savedSSID.length() == 0) {

    Serial.println();
    Serial.println("[WIFI] No saved WiFi credentials.");

    return;
  }

  Serial.println();
  Serial.println("[WIFI] Connecting...");

  Serial.print("[WIFI] SSID: ");
  Serial.println(savedSSID);

  WiFi.mode(WIFI_STA);

  WiFi.begin(savedSSID.c_str(), savedPassword.c_str());

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 20000) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("[WIFI] CONNECTED!");

    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());

    Serial.print("[WIFI] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

  } else {

    Serial.println("[WIFI] CONNECTION FAILED!");

    Serial.print("[WIFI] Status: ");
    Serial.println(WiFi.status());
  }
}

// ============================================================
// NTP
// ============================================================

void setupTime() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("[NTP] WiFi not connected. Skipping NTP.");

    return;
  }

  Serial.println();
  Serial.println("[NTP] Synchronizing time...");

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);

  struct tm timeinfo;

  if (getLocalTime(&timeinfo, 10000)) {

    Serial.println("[NTP] Time synchronized successfully.");

    Serial.print("[NTP] Current time: ");

    Serial.printf("%04d-%02d-%02d %02d:%02d:%02d\n",

                  timeinfo.tm_year + 1900, timeinfo.tm_mon + 1,
                  timeinfo.tm_mday,

                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);

  } else {

    Serial.println("[NTP] Time synchronization failed.");
  }
}

// ============================================================
// MQTT CONNECTION
// ============================================================

void connectMQTT() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("[MQTT] WiFi not connected.");

    return;
  }

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println();
  Serial.println("[MQTT] Connecting...");

  Serial.print("[MQTT] Broker: ");
  Serial.println(MQTT_BROKER);

  String clientID =
      "RollSync-ESP32-" + String((uint32_t)ESP.getEfuseMac(), HEX);

  Serial.print("[MQTT] Client ID: ");
  Serial.println(clientID);

  if (mqttClient.connect(clientID.c_str())) {

    Serial.println("[MQTT] CONNECTED!");

  } else {

    Serial.print("[MQTT] CONNECTION FAILED!");

    Serial.print(" State=");

    Serial.println(mqttClient.state());
  }
}

// ============================================================
// MQTT PUBLISH
// ============================================================

void publishRFID(String uid, String name) {

  if (!mqttClient.connected()) {

    Serial.println("[MQTT] Not connected. Reconnecting...");

    connectMQTT();
  }

  if (!mqttClient.connected()) {

    Serial.println("[MQTT] Publish skipped.");

    return;
  }

  String timestamp = getCurrentTimestamp();

  String payload = "{";

  payload += "\"uid\":\"";
  payload += uid;
  payload += "\",";

  payload += "\"name\":\"";
  payload += name;
  payload += "\",";

  payload += "\"timestamp\":\"";
  payload += timestamp;
  payload += "\"";

  payload += "}";

  Serial.println();

  Serial.println("[MQTT] Publishing RFID event...");

  Serial.print("[MQTT] Topic: ");

  Serial.println(MQTT_TOPIC);

  Serial.print("[MQTT] Payload: ");

  Serial.println(payload);

  bool success = mqttClient.publish(MQTT_TOPIC, payload.c_str());

  if (success) {

    Serial.println("[MQTT] PUBLISHED SUCCESSFULLY!");

  } else {

    Serial.println("[MQTT] PUBLISH FAILED!");
  }
}

// ============================================================
// OTA
// ============================================================

void setupOTA() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("[OTA] WiFi not connected.");

    return;
  }

  ArduinoOTA.setHostname("RollSync-ESP32");

  ArduinoOTA.setPassword("RollSyncOTA");

  ArduinoOTA.onStart([]() {
    Serial.println();
    Serial.println("[OTA] OTA UPDATE STARTED");
  });

  ArduinoOTA.onEnd([]() {
    Serial.println();
    Serial.println("[OTA] OTA UPDATE COMPLETE");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA] Progress: %u%%\r", (progress * 100) / total);
  });

  ArduinoOTA.onError(
      [](ota_error_t error) { Serial.printf("\n[OTA] Error[%u]\n", error); });

  ArduinoOTA.begin();

  Serial.println();
  Serial.println("[OTA] OTA READY");

  Serial.println("[OTA] Hostname: RollSync-ESP32");

  Serial.print("[OTA] IP: ");

  Serial.println(WiFi.localIP());
}

// ============================================================
// FORGET WIFI
// ============================================================

void forgetWiFi() {

  Serial.println();
  Serial.println("[WIFI] Clearing saved WiFi credentials...");

  preferences.begin("wifi", false);

  preferences.clear();

  preferences.end();

  Serial.println("[WIFI] Credentials cleared.");

  Serial.println("[WIFI] Restarting ESP32...");

  delay(1000);

  ESP.restart();
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println();

  Serial.println("============================================");

  Serial.println("       RollSync ESP32-S3");

  Serial.println("       RFID Attendance System");

  Serial.println("============================================");

  // ========================================================
  // SPI
  // ========================================================

  Serial.println();

  Serial.println("[SPI] Starting SPI...");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);

  Serial.println("[SPI] SPI ready.");

  // ========================================================
  // RFID
  // ========================================================

  Serial.println();

  Serial.println("[RFID] Initializing RC522...");

  rfid.PCD_Init();

  delay(100);

  byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);

  Serial.print("[RFID] VersionReg: 0x");

  if (version < 0x10) {
    Serial.print("0");
  }

  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {

    Serial.println("[RFID] WARNING: RC522 communication failed!");

  } else {

    Serial.println("[RFID] RC522 detected.");
  }

  // ========================================================
  // WIFI
  // ========================================================

  connectWiFi();

  // ========================================================
  // NTP
  // ========================================================

  setupTime();

  // ========================================================
  // MQTT
  // ========================================================

  connectMQTT();

  // ========================================================
  // OTA
  // ========================================================

  setupOTA();

  // ========================================================
  // STATUS
  // ========================================================

  Serial.println();

  Serial.println("############################################");

  Serial.println("# WiFi : " + String(WiFi.status() == WL_CONNECTED
                                          ? "CONNECTED"
                                          : "OFFLINE"));

  Serial.println("# RFID : READY");

  Serial.println("# MQTT : " +
                 String(mqttClient.connected() ? "CONNECTED" : "OFFLINE"));

  Serial.println("# OTA  : " +
                 String(WiFi.status() == WL_CONNECTED ? "READY" : "OFFLINE"));

  Serial.println("############################################");

  Serial.println();

  Serial.println("System ready.");

  Serial.println("Tap an RFID card...");

  Serial.println();

  Serial.println("TIP: Type 'w' + Enter to forget saved WiFi.");

  Serial.println();
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  // ========================================================
  // OTA
  // ========================================================

  if (WiFi.status() == WL_CONNECTED) {

    ArduinoOTA.handle();
  }

  // ========================================================
  // MQTT
  // ========================================================

  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {

    connectMQTT();
  }

  mqttClient.loop();

  // ========================================================
  // SERIAL COMMAND
  // ========================================================

  if (Serial.available()) {

    char command = Serial.read();

    if (command == 'w' || command == 'W') {

      forgetWiFi();
    }
  }

  // ========================================================
  // RFID — CARD DETECTION
  // ========================================================

  if (!rfid.PICC_IsNewCardPresent()) {

    delay(20);

    return;
  }

  Serial.println();
  Serial.println("[RFID] CARD DETECTED!");

  // ========================================================
  // CHECK RC522 SPI AGAIN
  // ========================================================

  byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);

  Serial.print("[RFID] VersionReg: 0x");

  if (version < 0x10) {
    Serial.print("0");
  }

  Serial.println(version, HEX);

  // ========================================================
  // READ UID
  // ========================================================

  if (!rfid.PICC_ReadCardSerial()) {

    Serial.println("[RFID] Card detected but UID read failed.");

    // ----------------------------------------------------
    // READ RC522 ERROR REGISTER
    // ----------------------------------------------------

    byte errorReg = rfid.PCD_ReadRegister(MFRC522::ErrorReg);

    Serial.print("[RFID] ErrorReg: 0x");

    if (errorReg < 0x10) {
      Serial.print("0");
    }

    Serial.println(errorReg, HEX);

    Serial.println("[RFID] Keep the card steady and try again.");

    rfid.PICC_HaltA();

    rfid.PCD_StopCrypto1();

    delay(300);

    return;
  }

  // ========================================================
  // GET UID
  // ========================================================

  String uid = getUID();

  // ========================================================
  // DUPLICATE CARD PROTECTION
  // ========================================================

  if (uid == lastUID && millis() - lastRFIDTime < RFID_COOLDOWN) {

    rfid.PICC_HaltA();

    rfid.PCD_StopCrypto1();

    delay(50);

    return;
  }

  lastUID = uid;

  lastRFIDTime = millis();

  // ========================================================
  // GET CARD HOLDER
  // ========================================================

  String name = getCardName(uid);

  // ========================================================
  // DISPLAY RESULT IN SERIAL
  // ========================================================

  Serial.println();

  Serial.println("============================================");

  Serial.println("[RFID] CARD VERIFIED");

  Serial.print("[RFID] UID  : ");

  Serial.println(uid);

  Serial.print("[RFID] NAME : ");

  Serial.println(name);

  Serial.print("[RFID] TIME : ");

  Serial.println(getCurrentTimestamp());

  Serial.println("============================================");

  // ========================================================
  // MQTT
  // ========================================================

  publishRFID(uid, name);

  // ========================================================
  // END RFID SESSION
  // ========================================================

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();

  delay(300);
}