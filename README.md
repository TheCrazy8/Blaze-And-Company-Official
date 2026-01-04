# Blaze & Company Official

## BrightOS
Arduino modular program for managing and running scripts with hardware control capabilities.

### Features
- Plugin and script loader system
- Telemetrix support for Arduino Uno R4 WiFi board control
- GUI interface for running scripts and managing connections

### Telemetrix Configuration
BrightOS supports connecting to Arduino Uno R4 WiFi boards via the Telemetrix protocol. To use this feature:

1. **Install the Telemetrix library** (if not already installed):
   ```bash
   pip install telemetrix-uno-r4-wifi
   ```

2. **Configure your Arduino board** with the Telemetrix firmware and connect it to your network.

3. **Find your Arduino's IP address** from your router or Arduino's serial output.

4. **Connect via the GUI**:
   - Launch BrightOS by running `python BrightOS.py`
   - Click the "Configure Telemetrix" button
   - Enter your Arduino board's IP address (e.g., `192.168.1.100`)
   - Click "Connect"

5. **Optional: Use environment variable**:
   - You can pre-fill the IP address by setting the `ARDUINO_IP_ADDRESS` environment variable:
     ```bash
     export ARDUINO_IP_ADDRESS=192.168.1.100
     python BrightOS.py
     ```

6. **Disconnect when done**:
   - Click "Disconnect Telemetrix" to safely shutdown the connection

### Running Scripts
Scripts loaded from your BrightOS Scripts directory can access the Telemetrix board through the `plugins["telemetrix"]` object.
