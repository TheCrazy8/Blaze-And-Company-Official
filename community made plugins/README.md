# Community Made Plugins

This directory contains community-contributed plugins for BrightOS. Plugins are classes that extend BrightOS functionality and can be used by scripts.

## What are Plugins?

Plugins are Python classes that inherit from `SamplePlugin` and provide reusable functionality. They are loaded automatically by BrightOS and made available to all scripts through the `plugins` dictionary.

## Installing Plugins

1. Download the plugin file (`.py` file)
2. Copy it to your BrightOS Plugins directory:
   - **Windows**: `%USERPROFILE%\AppData\Local\BrightOS\Plugins\`
   - **Linux/macOS**: `~/.brightos/Plugins/`
3. Restart BrightOS - the plugin will be loaded automatically

## Using Plugins in Scripts

```python
def main(plugins):
    # Get a plugin by its class name
    my_plugin = plugins.get("PluginClassName")
    
    if my_plugin:
        # Use the plugin's methods
        my_plugin.some_method()
```

## Available Plugins

### MotorController
Control various types of motors (servos, DC motors) connected to Arduino.

**Functions:**
- `servo_control(pin, angle)` - Control servo position
- `dc_motor_control(pin, speed_percent)` - Control DC motor speed
- `stop_motor(pin, motor_type)` - Stop a specific motor
- `stop_all()` - Stop all motors
- `get_servo_position(pin)` - Get current servo position
- `sweep_servo(pin, start_angle, end_angle)` - Sweep servo back and forth
- `ramp_dc_motor(pin, start_speed, end_speed)` - Gradually ramp motor speed

**Download:** [motor_controller_plugin.py](motor_controller_plugin.py)

## Creating Your Own Plugins

To create a plugin:

1. Create a new Python file in this directory
2. Import the base class: `from simple_plugin_loader.sample_plugin import SamplePlugin`
3. Create a class that inherits from `SamplePlugin`:

```python
from simple_plugin_loader.sample_plugin import SamplePlugin

class MyPlugin(SamplePlugin):
    def __init__(self):
        # Initialize your plugin
        pass
    
    def my_function(self):
        # Your plugin functionality
        self.print("Hello from my plugin!")
```

4. Save the file and restart BrightOS

## Contributing

To share your plugin with the community:
1. Create a pull request to add your plugin to this directory
2. Include documentation in this README
3. Follow the existing plugin structure and style
