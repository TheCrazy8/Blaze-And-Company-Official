# Blaze & Company Official

## BrightOS
Arduino modular program for managing and running scripts with hardware control capabilities.

### Features
- Plugin and script loader system
- Telemetrix support for Arduino Uno R4 WiFi board control
- GUI interface for running scripts and managing connections

### Telemetrix Configuration
BrightOS supports connecting to Arduino Uno R4 WiFi boards via the Telemetrix protocol. The connection can be established automatically through auto-discovery, via environment variable, or manually.

#### Method 1: Auto-Discovery (Easiest - Recommended)

BrightOS can automatically discover Arduino boards running the BrightOS_Telemetrix firmware on your local network.

1. **Install the Telemetrix library**:
   ```bash
   pip install telemetrix-uno-r4
   ```

2. **Upload the BrightOS_Telemetrix firmware** to your Arduino Uno R4 WiFi:
   - See instructions in `arduino/BrightOS_Telemetrix/README.md`
   - The Arduino will broadcast its IP address on your network

3. **Start BrightOS**:
   ```bash
   python BrightOS.py
   ```
   
   BrightOS will automatically:
   - Listen for Arduino board broadcasts
   - Detect any Arduino running BrightOS_Telemetrix firmware
   - Connect to the first board found
   
   You'll see messages like:
   ```
   Listening for Arduino board broadcasts for 10 seconds...
   Discovered Arduino board at 192.168.1.100
   Successfully connected to Arduino board at 192.168.1.100
   ```

#### Method 2: Environment Variable (Fast)

If auto-discovery doesn't work or you want to skip the discovery wait:

1. **Find your Arduino's IP address** (shown in Arduino Serial Monitor)

2. **Set the environment variable**:
   
   **Linux/Mac:**
   ```bash
   export ARDUINO_IP_ADDRESS=192.168.1.100
   python BrightOS.py
   ```
   
   **Windows (Command Prompt):**
   ```cmd
   set ARDUINO_IP_ADDRESS=192.168.1.100
   python BrightOS.py
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:ARDUINO_IP_ADDRESS="192.168.1.100"
   python BrightOS.py
   ```

#### Method 3: Manual Connection (Alternative)

If you prefer to connect manually after BrightOS starts:

1. **Launch BrightOS**: `python BrightOS.py`
2. **Click "Configure Telemetrix"** button
3. **Enter your Arduino's IP address** (e.g., `192.168.1.100`)
4. **Click "Connect"**

#### Disconnecting

- Click "Disconnect Telemetrix" to safely shutdown the connection
- The connection is automatically closed when BrightOS exits

#### Troubleshooting Auto-Discovery

If auto-discovery doesn't find your Arduino:
- Ensure the Arduino is running the BrightOS_Telemetrix firmware
- Check that both Arduino and computer are on the same network
- Verify no firewall is blocking UDP port 31336
- Try Method 2 (environment variable) or Method 3 (manual) instead

### Running Scripts
Scripts loaded from your BrightOS Scripts directory can access the Telemetrix board through the `plugins["telemetrix"]` object.
