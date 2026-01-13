# Blaze & Company Official

## BrightOS
Arduino modular program for managing and running scripts with hardware control capabilities.

### HOW TO USE:
1. Download and run BrightOS.py
2. Follow telemetrix configuration

### Features
- Plugin and script loader system
- Telemetrix support for Arduino Uno R4 WiFi board control
- GUI interface for running scripts and managing connections

### Telemetrix Configuration
Arduino
Open Arduino IDE

Install Telemetrix4UnoR4 library:

Go to Sketch → Include Library → Manage Libraries
Search for "Telemetrix4UnoR4"
Click Install
Load the WiFi example:

Go to File → Examples → Telemetrix4UnoR4 → WiFi_Telemetrix4UnoR4WiFi
Create arduino_secrets.h file in the same folder as the sketch:

arduino_secrets.h
// WiFi credentials for Arduino Uno R4 WiFi
#define SECRET_SSID "YOUR_WIFI_NETWORK_NAME"
#define SECRET_PASS "YOUR_WIFI_PASSWORD"

Upload to your Arduino Uno R4 WiFi board

Open Serial Monitor (115200 baud) to see the Arduino's IP address:

Code
WiFi connected successfully!
========================================
SSID: YourNetworkName  
IP Address: Whatever the Arduino returns
========================================
