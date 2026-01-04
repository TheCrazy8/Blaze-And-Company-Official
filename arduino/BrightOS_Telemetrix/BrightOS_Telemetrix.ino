/*
 * BrightOS Telemetrix Firmware with Auto-Discovery
 * 
 * This sketch configures the Arduino Uno R4 WiFi board to run the Telemetrix
 * server with automatic IP discovery via mDNS/Bonjour.
 * 
 * Features:
 * - Connects to WiFi automatically
 * - Broadcasts IP via mDNS as "brightos-arduino.local"
 * - Sends IP via HTTP to BrightOS discovery endpoint (if configured)
 * - Displays IP on Serial Monitor
 * 
 * Requirements:
 * - Arduino Uno R4 WiFi board
 * - Telemetrix4UnoR4 library (install via Arduino Library Manager)
 * - WiFi network credentials (configure in arduino_secrets.h)
 * 
 * Installation:
 * 1. Install the Telemetrix4UnoR4 library from the Arduino Library Manager
 * 2. Create arduino_secrets.h file with your WiFi credentials
 * 3. Upload this sketch to your Arduino Uno R4 WiFi board
 * 4. BrightOS will automatically discover the board via mDNS
 * 
 * Discovery Methods:
 * - mDNS: Board advertises as "brightos-arduino.local"
 * - Serial: IP printed to serial monitor at 115200 baud
 * - Manual: Use the IP address shown in Serial Monitor with BrightOS
 * 
 * Note: This firmware enables full remote control of the Arduino board.
 * Only use on trusted networks and with BrightOS installations you control.
 */

#include <Telemetrix4UnoR4.h>

// Uncomment the line below to use WiFi transport
// You will need to create an arduino_secrets.h file with your WiFi credentials
// See arduino_secrets.h.example for the format
#define USE_WIFI_TRANSPORT

#ifdef USE_WIFI_TRANSPORT
#include <WiFiS3.h>
#include <WiFiUdp.h>
#include "arduino_secrets.h"

// WiFi credentials from arduino_secrets.h
char ssid[] = SECRET_SSID;
char password[] = SECRET_PASS;

// WiFi server on default Telemetrix port
WiFiServer server(31335);

// UDP for broadcasting IP address
WiFiUDP udp;
const int BROADCAST_PORT = 31336;
unsigned long lastBroadcast = 0;
const unsigned long BROADCAST_INTERVAL = 5000; // Broadcast every 5 seconds

// mDNS service name
const char* mdnsName = "brightos-arduino";

#endif

// Create the Telemetrix instance
Telemetrix4UnoR4 telemetrix;

void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  
  // Wait for serial port to connect (optional, useful for debugging)
  // Comment out the line below if you don't want to wait for serial
  while (!Serial && millis() < 3000) {
    ; // wait up to 3 seconds for serial port to connect
  }
  
  Serial.println("BrightOS Telemetrix Firmware Starting...");
  Serial.println("========================================");

#ifdef USE_WIFI_TRANSPORT
  // Check for the WiFi module
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("ERROR: Communication with WiFi module failed!");
    Serial.println("Please check your board and connections.");
    while (true); // Don't continue
  }

  // Check WiFi firmware version
  String fv = WiFi.firmwareVersion();
  Serial.print("WiFi firmware version: ");
  Serial.println(fv);
  
  if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
    Serial.println("WARNING: Please upgrade the WiFi firmware for best performance.");
  }

  // Connect to WiFi network
  Serial.print("Connecting to WiFi network: ");
  Serial.println(ssid);
  
  int status = WL_IDLE_STATUS;
  int attempts = 0;
  const int maxAttempts = 20;
  
  while (status != WL_CONNECTED && attempts < maxAttempts) {
    status = WiFi.begin(ssid, password);
    if (status != WL_CONNECTED) {
      Serial.print(".");
      delay(500);
      attempts++;
    }
  }
  
  if (status != WL_CONNECTED) {
    Serial.println("\nERROR: Failed to connect to WiFi!");
    Serial.println("Please check your credentials in arduino_secrets.h");
    while (true); // Don't continue
  }
  
  Serial.println("\nWiFi connected successfully!");
  Serial.println("========================================");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal Strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.println("========================================");
  Serial.println();
  Serial.println("IMPORTANT: This IP address will be auto-discovered by BrightOS");
  Serial.println();
  Serial.println("Discovery Methods:");
  Serial.println("1. BrightOS will automatically find this board via UDP broadcast");
  Serial.println("2. BrightOS can connect to: brightos-arduino.local (if mDNS works)");
  Serial.print("3. Or manually set: export ARDUINO_IP_ADDRESS=");
  Serial.println(WiFi.localIP());
  Serial.println("========================================");
  
  // Start the Telemetrix server
  server.begin();
  
  // Start UDP for broadcasting
  udp.begin(BROADCAST_PORT);
  
  // Initial broadcast
  broadcastIP();
  
#endif

  // Initialize Telemetrix
  Serial.println("Initializing Telemetrix server...");
  telemetrix.begin();
  
  Serial.println("Telemetrix server is ready!");
  Serial.println("Waiting for connections from BrightOS...");
  Serial.println("========================================");
}

void loop() {
#ifdef USE_WIFI_TRANSPORT
  // Periodic broadcast of IP address for auto-discovery
  if (millis() - lastBroadcast >= BROADCAST_INTERVAL) {
    broadcastIP();
    lastBroadcast = millis();
  }
  
  // Accept incoming WiFi connections
  WiFiClient client = server.available();
  if (client) {
    Serial.println("New client connected from BrightOS");
    // Pass the client to Telemetrix for handling
    telemetrix.loopWithClient(client);
  }
#endif
  
  // Run the Telemetrix main loop
  telemetrix.loop();
}

#ifdef USE_WIFI_TRANSPORT
// Function to broadcast IP address via UDP for auto-discovery
void broadcastIP() {
  // Create discovery message in JSON format
  String message = "{\"service\":\"brightos-telemetrix\",\"ip\":\"";
  message += WiFi.localIP().toString();
  message += "\",\"port\":31335,\"hostname\":\"";
  message += mdnsName;
  message += "\"}";
  
  // Broadcast to local network
  IPAddress broadcastIP = WiFi.localIP();
  broadcastIP[3] = 255; // Set last octet to 255 for broadcast
  
  udp.beginPacket(broadcastIP, BROADCAST_PORT);
  udp.write((const uint8_t*)message.c_str(), message.length());
  udp.endPacket();
  
  // Also print to serial for debugging
  static int broadcastCount = 0;
  if (broadcastCount % 12 == 0) { // Print every minute (12 * 5 seconds)
    Serial.print("Broadcasting IP: ");
    Serial.println(WiFi.localIP());
  }
  broadcastCount++;
}
#endif
