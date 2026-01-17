/*
 * WiFi Telemetrix4UnoR4WiFi with Auto-Discovery
 * 
 * This is a modified version of the official WiFi_Telemetrix4UnoR4WiFi example
 * that adds UDP broadcast functionality for automatic IP discovery.
 * 
 * The Arduino will broadcast its IP address on the local network every 5 seconds,
 * allowing BrightOS to automatically discover and connect to it.
 * 
 * Based on: WiFi_Telemetrix4UnoR4WiFi from Telemetrix4UnoR4 library
 * Modified to add: UDP broadcast for auto-discovery
 */

#include <Telemetrix4UnoR4.h>
#include <WiFiS3.h>
#include <WiFiUdp.h>
#include "arduino_secrets.h"

// WiFi credentials from arduino_secrets.h
char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;

// UDP broadcast configuration
WiFiUDP Udp;
const unsigned int BROADCAST_PORT = 48879;  // Port for broadcasting
const char* BROADCAST_MESSAGE_PREFIX = "BRIGHTOS_ARDUINO:";
unsigned long lastBroadcastTime = 0;
const unsigned long BROADCAST_INTERVAL = 5000;  // Broadcast every 5 seconds

// Telemetrix instance
Telemetrix4UnoR4 board;

void setup() {
  Serial.begin(115200);
  
  // Wait a bit for serial to initialize
  delay(1000);
  
  Serial.println("Starting WiFi Telemetrix with Auto-Discovery...");
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize UDP for broadcasting
  Udp.begin(BROADCAST_PORT);
  
  // Initialize Telemetrix
  board.initialize();
  
  Serial.println("Setup complete!");
  Serial.println("Broadcasting IP address for auto-discovery...");
}

void loop() {
  // Run Telemetrix main loop
  board.run();
  
  // Broadcast IP address periodically
  unsigned long currentTime = millis();
  if (currentTime - lastBroadcastTime >= BROADCAST_INTERVAL) {
    broadcastIP();
    lastBroadcastTime = currentTime;
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi network: ");
  Serial.println(ssid);
  
  // Attempt to connect to WiFi network
  int status = WL_IDLE_STATUS;
  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);
    
    if (status != WL_CONNECTED) {
      Serial.println("Connection failed. Retrying in 5 seconds...");
      delay(5000);
    }
  }
  
  Serial.println("\nWiFi connected successfully!");
  Serial.println("========================================");
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal strength (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.println("========================================");
}

void broadcastIP() {
  // Get the local IP address
  IPAddress localIP = WiFi.localIP();
  
  // Create broadcast message: "BRIGHTOS_ARDUINO:192.168.1.100"
  String message = String(BROADCAST_MESSAGE_PREFIX) + localIP.toString();
  
  // Broadcast to all devices on the local network
  // Using broadcast address 255.255.255.255
  Udp.beginPacket("255.255.255.255", BROADCAST_PORT);
  Udp.print(message);
  Udp.endPacket();
  
  // Also send to multicast address for better network compatibility
  IPAddress multicastIP(239, 255, 255, 250);
  Udp.beginPacket(multicastIP, BROADCAST_PORT);
  Udp.print(message);
  Udp.endPacket();
}
