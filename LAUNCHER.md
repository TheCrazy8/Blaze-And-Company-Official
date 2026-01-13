# BrightOS Launcher

The BrightOS Launcher is a standalone executable that automatically manages your BrightOS installation.

## What it does

The launcher executable:
1. **Downloads/Updates BrightOS** - Automatically fetches the latest Python files from GitHub
2. **Installs Dependencies** - Ensures all required Python packages are installed
3. **Creates Directories** - Sets up all necessary folders for BrightOS
4. **Runs BrightOS** - Launches the BrightOS application

## Usage

Simply run `BrightOS-Launcher.exe` and it will:
- Check for updates to the BrightOS Python files
- Download any updates if available
- Install any missing dependencies
- Launch BrightOS

## Directory Structure

The launcher creates the following directory structure:

### Windows
```
%USERPROFILE%\AppData\Local\BrightOS\
├── install\           # BrightOS Python files
│   ├── BrightOS.py
│   ├── requirements.txt
│   └── version.txt
├── Plugins\           # User plugins
├── Scripts\           # User scripts
└── Importlist.txt     # Import configuration
```

### Linux/macOS
```
~/.brightos/
├── install/           # BrightOS Python files
├── Plugins/           # User plugins
├── Scripts/           # User scripts
└── Importlist.txt     # Import configuration
```

## Building the Launcher

To build the launcher executable yourself:

1. Install dependencies:
   ```bash
   pip install pyinstaller
   ```

2. Run the build script:
   ```bash
   python build_launcher.py
   ```

3. The executable will be in `dist/BrightOS-Launcher.exe`

## How Updates Work

- The **launcher.exe** is a static executable that you download once
- When you run it, it automatically downloads the latest **Python files** from GitHub
- You don't need to download a new .exe for updates - just run the launcher again
- Updates are pulled from the GitHub repository's latest release or main branch

## Advantages

- **Small download size** - The launcher is lightweight
- **Auto-updates** - Always get the latest BrightOS features automatically
- **No Python required** - The launcher includes Python runtime
- **Easy to use** - Just double-click and go
