#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>

// PIN DEFINITIONS

#define RST_PIN 14
#define SS_PIN 10
// Specific SPI pins for ESP32 mapping provided
#define SCK_PIN 12
#define MISO_PIN 13
#define MOSI_PIN 11

// RC522 Instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Function prototypes
void setupRFID();
void readRFID();
void handleCard();
void printUID();

void setup() {
    // 1. Initialize Serial at 115200
    Serial.begin(115200);
    delay(2000); // Wait for serial to initialize without blocking

    // 2. Initialize SPI using specific pins (SCK, MISO, MOSI, SS)
    SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);

    // 4. Initialize RC522
    setupRFID();

    Serial.println("\n==============================");
    Serial.println("ROLLSYNC RFID TEST");
    Serial.println("==============================");
    Serial.println("RC522 initialized.");

    // 4. Print the RC522 firmware/version to Serial
    Serial.print("Firmware Version: ");
    mfrc522.PCD_DumpVersionToSerial();

    Serial.println("\nTap your RFID card...\n");
}

void loop() {
    readRFID();
}

void setupRFID() {
    mfrc522.PCD_Init();
}

void readRFID() {
    // Look for new cards
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return;
    }

    // Select one of the cards
    if (!mfrc522.PICC_ReadCardSerial()) {
        return;
    }

    handleCard();
}

void handleCard() {
    Serial.println("\nCard detected!");
    
    // 1 & 2. Read its UID and print to Serial Monitor
    printUID();
    
    // 3. Prevent the same card from being repeatedly detected continuously
    // Halt PICC and stop encryption on PCD
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    
    // The library PICC_IsNewCardPresent() might still return true until it's physically gone
    // We will poll until it stops responding to wake up
    Serial.println("\nWaiting for next card...\n");
}

void printUID() {
    Serial.print("UID: ");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
        Serial.print(mfrc522.uid.uidByte[i], HEX);
    } 
    Serial.println();
}
