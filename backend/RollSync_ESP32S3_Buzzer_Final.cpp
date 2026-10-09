#include <Arduino.h>
#include <ArduinoOTA.h>
#include <MFRC522.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <WiFi.h>
#include <time.h>

// ============================================================
// ROLLSYNC
// ESP32-S3 + RC522 + Active Buzzer + WiFi + MQTT + NTP + OTA
// ============================================================

// -------------------- RC522 PINS --------------------
#define SCK_PIN   12
#define MISO_PIN  13
#define MOSI_PIN  11
#define SS_PIN    10
#define RST_PIN   14

// -------------------- BUZZER -------------------------
// For a 3.3V-compatible ACTIVE buzzer/module:
// Signal/S/+ -> GPIO 7, GND/- -> GND
#define BUZZER_PIN 7
const unsigned long BUZZER_BEEP_MS = 100;

// -------------------- MQTT CONFIG --------------------
const char *MQTT_BROKER = "broker.emqx.io";
const uint16_t MQTT_PORT = 1883;

// Corrected topic: remove accidental spaces from the old topic.
const char *MQTT_TOPIC = "classroom/RDB-6/rfid";

// -------------------- NTP CONFIG: INDIA --------------
const long GMT_OFFSET_SEC = 19800; // UTC +05:30
const int DAYLIGHT_OFFSET_SEC = 0;
const char *NTP_SERVER_1 = "pool.ntp.org";
const char *NTP_SERVER_2 = "time.nist.gov";

// -------------------- OBJECTS ------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);
MFRC522 rfid(SS_PIN, RST_PIN);
Preferences preferences;

// -------------------- WIFI STORAGE -------------------
String savedSSID = "";
String savedPassword = "";

// -------------------- RFID DUPLICATE PROTECTION ------
String lastUID = "";
unsigned long lastRFIDTime = 0;
const unsigned long RFID_COOLDOWN = 1500;

// ============================================================
// BUZZER
// ============================================================
void beepOnCardDetected() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(BUZZER_BEEP_MS);
  digitalWrite(BUZZER_PIN, LOW);
}

// ============================================================
// SERIAL INPUT
// ============================================================
String readSerialLine() {
  String input = "";

  while (true) {
    if (Serial.available()) {
      char c = Serial.read();

      if (c == '\n' || c == '\r') {
        if (input.length() > 0) {
          Serial.println();
          return input;
        }
        continue;
      }

      if (c == '\b' || c == 127) {
        if (input.length() > 0) {
          input.remove(input.length() - 1);
          Serial.print("\b \b");
        }
        continue;
      }

      input += c;
      Serial.print(c);
    }

    ArduinoOTA.handle();
    delay(5);
  }
}

// ============================================================
// WIFI CREDENTIAL STORAGE
// ============================================================
void loadWiFiCredentials() {
  preferences.begin("wifi", true);
  savedSSID = preferences.getString("ssid", "");
  savedPassword = preferences.getString("password", "");
  preferences.end();

  if (savedSSID.length() > 0) {
    Serial.println();
    Serial.println("[WIFI] Saved Wi-Fi credentials found.");
    Serial.print("[WIFI] Saved SSID: ");
    Serial.println(savedSSID);
  } else {
    Serial.println();
    Serial.println("[WIFI] No saved Wi-Fi credentials.");
  }
}

void saveWiFiCredentials(String ssid, String password) {
  preferences.begin("wifi", false);
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.end();

  savedSSID = ssid;
  savedPassword = password;

  Serial.println();
  Serial.println("[WIFI] Credentials saved to ESP32 flash.");
}

void clearWiFiCredentials() {
  preferences.begin("wifi", false);
  preferences.clear();
  preferences.end();

  savedSSID = "";
  savedPassword = "";

  Serial.println();
  Serial.println("[WIFI] Saved Wi-Fi credentials cleared.");
}

// ============================================================
// WIFI SCANNING
// ============================================================
int scanWiFiNetworks() {
  Serial.println();
  Serial.println("============================================");
  Serial.println("[WIFI] Scanning available networks...");
  Serial.println("============================================");

  WiFi.mode(WIFI_STA);
  int networkCount = WiFi.scanNetworks();

  if (networkCount <= 0) {
    Serial.println("[WIFI] No networks found.");
    WiFi.scanDelete();
    return 0;
  }

  String displayed[30];
  int displayedCount = 0;

  for (int i = 0; i < networkCount && displayedCount < 30; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;

    bool duplicate = false;
    for (int j = 0; j < displayedCount; j++) {
      if (displayed[j] == ssid) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) continue;

    displayed[displayedCount] = ssid;
    String security = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN)
                        ? "[OPEN]" : "[SECURED]";

    Serial.printf("[%d] %-28s %4d dBm  %s\n",
                  displayedCount + 1, ssid.c_str(),
                  WiFi.RSSI(i), security.c_str());
    displayedCount++;
  }

  WiFi.scanDelete();
  return displayedCount;
}

// ============================================================
// WIFI MANUAL SETUP
// ============================================================
bool setupNewWiFi() {
  int displayedCount = scanWiFiNetworks();
  if (displayedCount <= 0) return false;

  Serial.println();
  Serial.println("Select network:");

  String networks[30];
  WiFi.mode(WIFI_STA);
  int rawCount = WiFi.scanNetworks();
  int count = 0;

  for (int i = 0; i < rawCount && count < 30; i++) {
    String ssid = WiFi.SSID(i);
    if (ssid.length() == 0) continue;

    bool duplicate = false;
    for (int j = 0; j < count; j++) {
      if (networks[j] == ssid) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) continue;

    networks[count++] = ssid;
  }
  WiFi.scanDelete();

  if (count == 0) return false;

  for (int i = 0; i < count; i++) {
    Serial.printf("[%d] %s\n", i + 1, networks[i].c_str());
  }

  Serial.println();
  Serial.printf("Select network [1-%d]: ", count);
  String choice = readSerialLine();
  int selected = choice.toInt();

  if (selected < 1 || selected > count) {
    Serial.println("[WIFI] Invalid selection.");
    return false;
  }

  String selectedSSID = networks[selected - 1];

  Serial.println();
  Serial.printf("Password for \"%s\":\n", selectedSSID.c_str());
  Serial.print("> ");
  String password = readSerialLine();

  Serial.println();
  Serial.println("============================================");
  Serial.println("[WIFI] Connecting...");
  Serial.println("============================================");

  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_STA);
  WiFi.begin(selectedSSID.c_str(), password.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection failed.");
    WiFi.disconnect();
    return false;
  }

  Serial.println("[WIFI] CONNECTED!");
  Serial.print("[WIFI] IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("[WIFI] Gateway: ");
  Serial.println(WiFi.gatewayIP());
  Serial.print("[WIFI] RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  saveWiFiCredentials(selectedSSID, password);
  return true;
}

// ============================================================
// CONNECT USING SAVED WIFI
// ============================================================
bool connectSavedWiFi() {
  if (savedSSID.length() == 0) return false;

  Serial.println();
  Serial.println("============================================");
  Serial.println("[WIFI] Auto-connecting to saved network...");
  Serial.println("============================================");
  Serial.print("[WIFI] SSID: ");
  Serial.println(savedSSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSSID.c_str(), savedPassword.c_str());

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Could not connect to saved network.");
    WiFi.disconnect();
    return false;
  }

  Serial.println("[WIFI] CONNECTED!");
  Serial.print("[WIFI] IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("[WIFI] Gateway: ");
  Serial.println(WiFi.gatewayIP());
  Serial.print("[WIFI] RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  return true;
}

// ============================================================
// INTERNET TEST
// ============================================================
bool testInternet() {
  Serial.println();
  Serial.println("============================================");
  Serial.println("[INTERNET] Testing Internet connection...");
  Serial.println("============================================");

  Serial.println();
  Serial.println("[1] DNS -> example.com");
  IPAddress serverIP;
  unsigned long start = millis();

  if (WiFi.hostByName("example.com", serverIP)) {
    unsigned long elapsed = millis() - start;
    Serial.print("[DNS] SUCCESS: ");
    Serial.print(serverIP);
    Serial.print(" - ");
    Serial.print(elapsed);
    Serial.println(" ms");
  } else {
    Serial.println("[DNS] FAILED");
    return false;
  }

  Serial.println();
  Serial.println("[2] TCP -> example.com:80");
  WiFiClient testClient;
  start = millis();

  if (testClient.connect("example.com", 80)) {
    unsigned long elapsed = millis() - start;
    Serial.print("[TCP] SUCCESS - ");
    Serial.print(elapsed);
    Serial.println(" ms");
    testClient.stop();
    Serial.println();
    Serial.println("[INTERNET] Internet connection OK!");
    return true;
  }

  unsigned long elapsed = millis() - start;
  Serial.print("[TCP] FAILED - ");
  Serial.print(elapsed);
  Serial.println(" ms");
  testClient.stop();
  Serial.println();
  Serial.println("[INTERNET] Internet test failed.");
  return false;
}

// ============================================================
// WIFI SETUP
// ============================================================
bool setupWiFi() {
  loadWiFiCredentials();

  if (savedSSID.length() > 0) {
    if (connectSavedWiFi()) {
      if (testInternet()) return true;
      Serial.println();
      Serial.println("[WIFI] Connected to Wi-Fi but Internet failed.");
    }
  }

  Serial.println();
  Serial.println("============================================");
  Serial.println("           WIFI SETUP REQUIRED");
  Serial.println("============================================");

  while (true) {
    if (setupNewWiFi()) {
      if (testInternet()) return true;
      Serial.println();
      Serial.println("[WIFI] Internet test failed.");
      Serial.println("[WIFI] Please select another network.");
      delay(1000);
    } else {
      Serial.println();
      Serial.println("[WIFI] Setup failed.");
      Serial.println("[WIFI] Retrying...");
      delay(2000);
    }
  }
}

// ============================================================
// NTP TIME
// ============================================================
void setupTime() {
  Serial.println();
  Serial.println("============================================");
  Serial.println("[NTP] Synchronizing time...");
  Serial.println("============================================");

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC,
             NTP_SERVER_1, NTP_SERVER_2);

  struct tm timeinfo;
  int attempts = 0;

  while (!getLocalTime(&timeinfo) && attempts < 20) {
    Serial.print(".");
    delay(500);
    attempts++;
  }
  Serial.println();

  if (attempts >= 20) {
    Serial.println("[NTP] Time synchronization failed.");
    return;
  }

  Serial.println("[NTP] Time synchronized successfully.");
  Serial.print("[NTP] Current time: ");

  char buffer[40];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  Serial.println(buffer);
}

String getCurrentTimestamp() {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01T00:00:00+05:30";
  }

  char buffer[40];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  return String(buffer) + "+05:30";
}

// ============================================================
// MQTT
// ============================================================
String getDeviceID() {
  uint64_t chipid = ESP.getEfuseMac();
  char buffer[20];

  snprintf(buffer, sizeof(buffer), "%04X%08X",
           (uint16_t)(chipid >> 32), (uint32_t)chipid);
  return String(buffer);
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println();
    Serial.println("[MQTT] Connecting...");

    String clientID = "RollSync-ESP32-" + getDeviceID();

    Serial.print("[MQTT] Broker: ");
    Serial.println(MQTT_BROKER);
    Serial.print("[MQTT] Client ID: ");
    Serial.println(clientID);

    if (mqttClient.connect(clientID.c_str())) {
      Serial.println("[MQTT] CONNECTED!");
    } else {
      Serial.print("[MQTT] FAILED, State = ");
      Serial.println(mqttClient.state());
      Serial.println("[MQTT] Retrying in 3 seconds...");
      delay(3000);
    }
  }
}

// ============================================================
// RFID NAME MAPPING
// ============================================================
String getCardName(String uid) {
  if (uid == "264A1507") return "PD";
  if (uid == "3F67F4B5") return "Brajesh";
  if (uid == "1FEEF5B5") return "Ritwika";
  if (uid == "5F91A6DD") return "Nitesh";
  if (uid == "3F97A7DD") return "Subham";
  if (uid == "3FAA03B6") return "Pragyan";
  return "Unknown Card";
}

// ============================================================
// RFID UID
// ============================================================
String getUID() {
  String uidString = "";

  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(rfid.uid.uidByte[i], HEX);
  }

  uidString.toUpperCase();
  return uidString;
}

// ============================================================
// PUBLISH RFID EVENT
// ============================================================
void publishRFID(String uid, String name) {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  String timestamp = getCurrentTimestamp();

  String payload = "{";
  payload += "\"uid\":\"" + uid + "\",";
  payload += "\"name\":\"" + name + "\",";
  payload += "\"timestamp\":\"" + timestamp + "\"";
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
// RFID SETUP
// ============================================================
void setupRFID() {
  Serial.println();
  Serial.println("[RFID] Initializing RC522...");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  delay(50);

  byte version = rfid.PCD_ReadRegister(MFRC522::VersionReg);

  Serial.print("[RFID] VersionReg: 0x");
  if (version < 0x10) Serial.print("0");
  Serial.println(version, HEX);

  if (version == 0x00 || version == 0xFF) {
    Serial.println("[RFID] ERROR: RC522 not detected.");
    return;
  }

  Serial.println("[RFID] RC522 ready.");
}

// ============================================================
// OTA
// ============================================================
void setupOTA() {
  ArduinoOTA.setHostname("RollSync-ESP32");
  ArduinoOTA.setPassword("RollSyncOTA");

  ArduinoOTA
    .onStart([]() {
      Serial.println();
      Serial.println("[OTA] Starting update...");
    })
    .onEnd([]() {
      Serial.println();
      Serial.println("[OTA] Update complete!");
    })
    .onProgress([](unsigned int progress, unsigned int total) {
      Serial.printf("[OTA] Progress: %u%%\r", (progress * 100) / total);
    })
    .onError([](ota_error_t error) {
      Serial.printf("\n[OTA] Error[%u]\n", error);
    });

  ArduinoOTA.begin();

  Serial.println();
  Serial.println("[OTA] OTA READY");
  Serial.print("[OTA] Hostname: ");
  Serial.println("RollSync-ESP32");
  Serial.print("[OTA] IP: ");
  Serial.println(WiFi.localIP());
}

// ============================================================
// SERIAL COMMANDS
// ============================================================
void checkSerialCommands() {
  if (!Serial.available()) return;

  String command = Serial.readStringUntil('\n');
  command.trim();
  command.toLowerCase();

  // Type w + Enter to clear saved Wi-Fi credentials and restart.
  if (command == "w") {
    Serial.println();
    Serial.println("[SYSTEM] Clearing saved Wi-Fi...");
    clearWiFiCredentials();
    Serial.println("[SYSTEM] Restarting...");
    delay(1000);
    ESP.restart();
  }
}

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println();
  Serial.println();
  Serial.println("############################################");
  Serial.println("#                 ROLLSYNC                 #");
  Serial.println("# ESP32-S3 RFID + BUZZER + WiFi + MQTT     #");
  Serial.println("############################################");

  // Active buzzer output starts OFF.
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Wi-Fi power saving OFF.
  WiFi.setSleep(false);

  // Initialize RFID.
  setupRFID();

  // Connect Wi-Fi, using saved credentials when available.
  if (!setupWiFi()) {
    Serial.println("[WIFI] ERROR: Could not establish network.");
    return;
  }

  // Synchronize local time.
  setupTime();

  // Connect MQTT.
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  connectMQTT();

  // Enable OTA updates.
  setupOTA();

  Serial.println();
  Serial.println("############################################");
  Serial.println("# WiFi   : CONNECTED                      #");
  Serial.println("# RFID   : READY                           #");
  Serial.println("# BUZZER : READY                           #");
  Serial.println("# MQTT   : CONNECTED                       #");
  Serial.println("# OTA    : READY                           #");
  Serial.println("############################################");

  Serial.println();
  Serial.println("System ready.");
  Serial.println("Tap an RFID card...");
  Serial.println("TIP: Type 'w' + Enter to forget saved WiFi.");
}

// ============================================================
// LOOP
// ============================================================
void loop() {
  // Keep OTA available.
  ArduinoOTA.handle();

  // Maintain MQTT connection.
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Process serial commands.
  checkSerialCommands();

  // Check for a new RFID card.
  if (!rfid.PICC_IsNewCardPresent()) {
    delay(20);
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    delay(20);
    return;
  }

  String uid = getUID();

  // Ignore rapid repeat reads of the same card.
  if (uid == lastUID && millis() - lastRFIDTime < RFID_COOLDOWN) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    delay(20);
    return;
  }

  lastUID = uid;
  lastRFIDTime = millis();

  String name = getCardName(uid);

  // Give a short beep for each accepted card detection.
  beepOnCardDetected();

  Serial.println();
  Serial.println("============================================");
  Serial.println("[RFID] CARD DETECTED");
  Serial.print("[RFID] UID  : ");
  Serial.println(uid);
  Serial.print("[RFID] NAME : ");
  Serial.println(name);
  Serial.println("============================================");

  // Publish the card event to MQTT.
  publishRFID(uid, name);

  // Stop RFID communication for this card.
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(300);
}
