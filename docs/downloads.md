# Downloads

Download community-made plugins and scripts for BrightOS to extend its functionality.

## Get BrightOS

::: tip Download BrightOS Launcher
**[Download BrightOS Launcher](https://github.com/TheCrazy8/Blaze-And-Company-Official/releases/tag/launcher-dev-20260113-175555)** - Get the latest BrightOS launcher to run plugins and scripts
:::

The launcher automatically downloads and updates BrightOS, then you can install plugins and scripts from below.

---

## What's the Difference?

- **Plugins** are reusable classes that provide functionality to scripts (like a library)
- **Scripts** are programs that you run in BrightOS to accomplish specific tasks

## Installation Instructions

### Installing Plugins

1. Download the plugin file (`.py` file) from the links below
2. Copy it to your BrightOS Plugins directory:
   - **Windows**: `%USERPROFILE%\AppData\Local\BrightOS\Plugins\`
   - **Linux/macOS**: `~/.brightos/Plugins/`
3. Restart BrightOS - the plugin will be loaded automatically

### Installing Scripts

1. Download the script file (`.py` file) from the links below
2. Copy it to your BrightOS Scripts directory:
   - **Windows**: `%USERPROFILE%\AppData\Local\BrightOS\Scripts\`
   - **Linux/macOS**: `~/.brightos/Scripts/`
3. Restart BrightOS - the script will appear in the script selection dropdown

## Available Plugins

### MotorController Plugin

Control various types of motors (servos, DC motors) connected to your Arduino board via Telemetrix.

**Features:**
- Servo motor position control (0-180 degrees)
- DC motor speed control with PWM (0-100%)
- Optional direction control for DC motors (forward/reverse)
- Emergency stop functionality
- Servo sweep animations
- Motor speed ramping
- Position tracking for servos

**Functions:**
- `servo_control(pin, angle)` - Move servo to specific angle
- `dc_motor_control(pin, speed_percent, direction_pin, forward)` - Control DC motor
- `stop_motor(pin, motor_type)` - Stop a specific motor
- `stop_all()` - Emergency stop all motors
- `get_servo_position(pin)` - Get current servo position
- `sweep_servo(pin, start_angle, end_angle, step, delay)` - Sweep servo animation
- `ramp_dc_motor(pin, start_speed, end_speed, step, delay)` - Gradual speed changes

**Requirements:**
- BrightOS with Telemetrix connection
- Arduino board with motor(s) connected

**Download:** [motor_controller_plugin.py](https://raw.githubusercontent.com/TheCrazy8/Blaze-And-Company-Official/main/community%20made%20plugins/motor_controller_plugin.py)

**Usage Example:**
```python
def main(plugins):
    board = plugins.get("telemetrix")
    # Note: Plugin keys are lowercase
    motor = plugins.get("motorcontroller")
    
    if motor and board:
        motor.set_board(board)
        
        # Control a servo on pin 9
        motor.servo_control(9, 90)
        
        # Control a DC motor on pin 5 at 75% speed
        motor.dc_motor_control(5, 75)
        
        # Stop all motors
        motor.stop_all()
```

---

## Available Scripts

### Example Script

Basic example demonstrating how to use the Telemetrix board to display messages on an Arduino LED matrix.

**Features:**
- Shows how to connect to Telemetrix
- Demonstrates scroll message functionality
- Includes proper cleanup in stop() function

**Requirements:**
- BrightOS with Telemetrix connection
- Arduino Uno R4 WiFi board

**Download:** [examplescript.py](https://raw.githubusercontent.com/TheCrazy8/Blaze-And-Company-Official/main/community%20made%20scripts/examplescript.py)

---

### Motor Control Example Script

Comprehensive demonstration of motor control capabilities using the MotorController plugin.

**Features:**
- Servo position control demonstration
- DC motor speed control with optional direction
- Servo sweep animations
- DC motor speed ramping
- Proper error handling and cleanup

**Hardware Setup:**
- Servo motor connected to pin 9
- DC motor connected to PWM pin 5
- Optional: Direction control pin 4 for H-bridge

**Requirements:**
- BrightOS with Telemetrix connection
- MotorController plugin installed
- Arduino board with motors connected

**Download:** [motor_example.py](https://raw.githubusercontent.com/TheCrazy8/Blaze-And-Company-Official/main/community%20made%20scripts/motor_example.py)

**What it demonstrates:**
1. Basic servo control - moving to specific angles
2. DC motor speed control - various speed settings
3. Servo sweep - smooth animation from 0-180 degrees
4. Motor ramping - gradual speed changes

---

## Creating Your Own Content

Want to create your own plugins and scripts? Check out the **[Development Guide](/development-guide)** for complete tutorials and examples.

### Quick Start

**Plugins** extend BrightOS with reusable functionality:

```python
from simple_plugin_loader.sample_plugin import SamplePlugin

class MyPlugin(SamplePlugin):
    def __init__(self):
        self._board = None
    
    def set_board(self, board):
        self._board = board
    
    def my_function(self):
        self.print("Hello from my plugin!")
```

**Scripts** are programs that use plugins:

```python
def main(plugins):
    """Main function - runs when script is executed"""
    board = plugins.get("telemetrix")
    
    if not board:
        print("Telemetrix not connected")
        return
    
    print("My script is running!")

def stop():
    """Optional - called when user clicks Stop button"""
    print("Script stopped")
```

**Learn more:** [Development Guide](/development-guide) - Complete tutorials with examples

---

## Contributing

Want to share your plugins or scripts with the community?

1. Fork the [repository](https://github.com/TheCrazy8/Blaze-And-Company-Official)
2. Add your plugin to `community made plugins/` or script to `community made scripts/`
3. Update the respective README.md file
4. Create a pull request

Please ensure your contributions:
- Are well-documented with comments
- Include usage examples
- Have been tested thoroughly
- Follow the existing code style

---

## Need Help?

- Check the [BrightOS Documentation](/)
- Visit the [GitHub Repository](https://github.com/TheCrazy8/Blaze-And-Company-Official)
- Review existing plugins and scripts for examples
- Try the [BrightOS Web Interface](/brightos-web) for testing

## Additional Resources

- [Build Documentation](/BUILD) - How to build BrightOS
- [Telemetrix Setup Guide](/) - Configure Arduino connection
- [GitHub Releases](https://github.com/TheCrazy8/Blaze-And-Company-Official/releases) - Download BrightOS
