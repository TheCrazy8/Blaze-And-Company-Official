# Blaze & Company Official

## BrightOS
Arduino modular program for managing and running scripts with hardware control capabilities.

### Quick Start

**Option 1: Use the Launcher (Recommended)**
1. Download `BrightOS-Launcher.exe` from the [latest launcher release](https://github.com/TheCrazy8/Blaze-And-Company-Official/releases)
2. Run it - the launcher will automatically:
   - Download the latest BrightOS Python files
   - Install dependencies
   - Create necessary directories
   - Launch BrightOS

**Option 2: Run Manually**
1. Download `BrightOS.py` and `requirements.txt` from the [latest release](https://github.com/TheCrazy8/Blaze-And-Company-Official/releases)
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `python BrightOS.py`

### Features
- Plugin and script loader system
- Telemetrix support for Arduino Uno R4 WiFi board control
- GUI interface with dark theme for running scripts and managing connections
- Auto-update capability through the launcher
- Custom window icon matching the website

### Directory Structure

When you run BrightOS (via launcher or manually), it creates:

**Windows:**
```
%USERPROFILE%\AppData\Local\BrightOS\
├── install\         # BrightOS files (if using launcher)
├── Plugins\         # Your custom plugins
├── Scripts\         # Your custom scripts
└── Importlist.txt   # Import configuration
```

**Linux/macOS:**
```
~/.brightos/
├── install/         # BrightOS files (if using launcher)
├── Plugins/         # Your custom plugins
├── Scripts/         # Your custom scripts
└── Importlist.txt   # Import configuration
```

### Telemetrix Configuration

#### Arduino Setup
1. Open Arduino IDE

2. Install Telemetrix4UnoR4 library:
   - Go to Sketch → Include Library → Manage Libraries  
   - Search for "Telemetrix4UnoR4"  
   - Click Install  

3. Load the WiFi example:
   - Go to File → Examples → Telemetrix4UnoR4 → WiFi_Telemetrix4UnoR4WiFi  

4. Create `arduino_secrets.h` file in the same folder as the sketch:
   ```cpp
   // WiFi credentials for Arduino Uno R4 WiFi  
   #define SECRET_SSID "YOUR_WIFI_NETWORK_NAME"  
   #define SECRET_PASS "YOUR_WIFI_PASSWORD"
   ```

5. Upload to your Arduino Uno R4 WiFi board

6. Open Serial Monitor (115200 baud) to see the Arduino's IP address:
   ```
   WiFi connected successfully!
   ========================================
   SSID: YourNetworkName  
   IP Address: 192.168.1.xxx
   ========================================
   ```

#### BrightOS Telemetrix Configuration
1. Launch BrightOS
2. Click "Configure Telemetrix"
3. Enter your Arduino's IP address
4. Click "Connect"

### Documentation
- [Launcher Documentation](LAUNCHER.md) - Details about the BrightOS Launcher
- [Build Documentation](BUILD.md) - How to build BrightOS and the launcher

### Updates
- **Using the Launcher**: Just run the launcher again - it automatically checks for and downloads updates
- **Manual Installation**: Download the latest release files and replace your existing files
