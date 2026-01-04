# BrightOS Telemetrix Arduino Firmware

This Arduino sketch enables your Arduino Uno R4 WiFi board to work with BrightOS via the Telemetrix protocol.

## What This Does

This firmware turns your Arduino Uno R4 WiFi into a Telemetrix server that:
- Connects to your WiFi network
- **Automatically broadcasts its IP address** for BrightOS to discover
- Listens for connections from BrightOS
- Allows remote control of all Arduino pins and features
- Supports GPIO, PWM, I2C, DHT sensors, servos, and more

The auto-discovery feature means you don't need to manually configure IP addresses - BrightOS will find your Arduino automatically!

## Requirements

### Hardware
- Arduino Uno R4 WiFi board
- USB cable for programming
- WiFi network

### Software
- Arduino IDE (version 2.0 or later recommended)
- Telemetrix4UnoR4 library (install via Arduino Library Manager)

## Installation Steps

### 1. Install the Telemetrix4UnoR4 Library

Open Arduino IDE and install the library:
1. Go to **Sketch → Include Library → Manage Libraries...**
2. Search for "Telemetrix4UnoR4"
3. Click **Install** on the "Telemetrix4UnoR4" library by Alan Yorinks
4. Wait for installation to complete

### 2. Configure WiFi Credentials

1. Copy `arduino_secrets.h.example` to `arduino_secrets.h`:
   ```bash
   cp arduino_secrets.h.example arduino_secrets.h
   ```

2. Edit `arduino_secrets.h` and add your WiFi credentials:
   ```cpp
   #define SECRET_SSID "YourWiFiNetworkName"
   #define SECRET_PASS "YourWiFiPassword"
   ```

3. **IMPORTANT**: Never commit `arduino_secrets.h` to version control!

### 3. Upload the Sketch

1. Connect your Arduino Uno R4 WiFi board via USB
2. Open `BrightOS_Telemetrix.ino` in Arduino IDE
3. Select your board: **Tools → Board → Arduino UNO R4 WiFi**
4. Select the correct port: **Tools → Port → (your Arduino port)**
5. Click the **Upload** button (→)
6. Wait for upload to complete

### 4. Get the IP Address

1. Open the Serial Monitor: **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Look for the line showing the IP address:
   ```
   IP Address: 192.168.1.XXX
   ```
4. **Write down this IP address** - you'll need it for BrightOS!

## Connecting to BrightOS

### Option 1: Auto-Discovery (Easiest - Recommended)

Simply start BrightOS and it will automatically find your Arduino:

```bash
python BrightOS.py
```

BrightOS will listen for broadcasts from your Arduino and connect automatically. No configuration needed!

### Option 2: Environment Variable (Fast)

If you want to skip the discovery process:

**Linux/Mac:**
```bash
export ARDUINO_IP_ADDRESS=192.168.1.XXX
python BrightOS.py
```

**Windows (Command Prompt):**
```cmd
set ARDUINO_IP_ADDRESS=192.168.1.XXX
python BrightOS.py
```

**Windows (PowerShell):**
```powershell
$env:ARDUINO_IP_ADDRESS="192.168.1.XXX"
python BrightOS.py
```

### Option 3: Manual Connection via GUI

1. Start BrightOS: `python BrightOS.py`
2. Click the **"Configure Telemetrix"** button
3. Enter your Arduino's IP address
4. Click **"Connect"**

## Troubleshooting

### Can't Connect to WiFi

- Double-check your SSID and password in `arduino_secrets.h`
- Ensure your WiFi network is 2.4GHz (Arduino Uno R4 WiFi doesn't support 5GHz)
- Check that your network allows new device connections
- Try moving the Arduino closer to your WiFi router

### Can't Find the IP Address

- Open Serial Monitor (Tools → Serial Monitor)
- Set baud rate to 115200
- Press the reset button on the Arduino
- The IP address will be displayed after WiFi connection

### BrightOS Can't Connect

- Verify the IP address is correct
- Ensure Arduino and computer are on the same network
- Check that port 31335 is not blocked by firewall
- Try pinging the Arduino: `ping 192.168.1.XXX`

### "WiFi Module Not Found" Error

- Ensure you have the Arduino Uno R4 **WiFi** model (not Minima)
- Try updating the WiFi firmware (see Arduino documentation)
- Check that the WiFi module is properly seated

## Features Supported

The Telemetrix protocol supports:
- **Digital I/O**: Read/write digital pins
- **Analog Input**: Read analog values from pins
- **PWM**: Control PWM pins for LED dimming, motor speed, etc.
- **Servos**: Control servo motors
- **I2C**: Communicate with I2C devices
- **DHT Sensors**: Read DHT11/DHT22 temperature and humidity sensors
- **Ultrasonic Sensors**: Read HC-SR04 distance sensors
- **Encoders**: Read rotary encoders
- **And more!**

## Security Note

⚠️ **IMPORTANT**: This firmware allows full remote control of your Arduino board.

- Only use on trusted networks
- Only connect to BrightOS installations you control
- Never expose the Arduino directly to the internet without proper security
- Keep `arduino_secrets.h` private and out of version control

## Additional Resources

- [Telemetrix4UnoR4 Documentation](https://docs.arduino.cc/libraries/telemetrix4unor4/)
- [Telemetrix User Guide](https://mryslab.github.io/telemetrix-uno-r4/)
- [Arduino Uno R4 WiFi Examples](https://docs.arduino.cc/tutorials/uno-r4-wifi/wifi-examples/)
- [BrightOS Documentation](../README.md)

## License

This firmware is part of the BrightOS project and follows the same license.
The Telemetrix4UnoR4 library is licensed separately by its author.

## Support

For issues with:
- **This firmware**: Open an issue in the BrightOS repository
- **Telemetrix library**: See the [Telemetrix4UnoR4 GitHub](https://github.com/MrYsLab/Telemetrix4UnoR4)
- **Arduino hardware**: Visit [Arduino Support](https://support.arduino.cc/)
