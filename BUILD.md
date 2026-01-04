# BrightOS Build Process

This document describes how to build and release BrightOS executables.

## Overview

BrightOS uses PyInstaller to create standalone Windows executables. The build process is automated through GitHub Actions and can also be run locally.

## Local Build

### Prerequisites

- Python 3.11 or later
- Windows operating system (for building .exe files)

### Steps

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the build script:
   ```bash
   python build.py
   ```

3. The executable will be created in the `dist/` folder:
   ```
   dist/BrightOS.exe
   ```

## Automated Release Process

### Creating a Release

The GitHub Actions workflow automatically builds and releases BrightOS when you push a version tag:

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions will:
   - Build BrightOS.exe on Windows
   - Create a GitHub Release with the tag name
   - Upload the executable to the release

### Manual Trigger

You can also manually trigger a build from the GitHub Actions tab:

1. Go to the Actions tab in your repository
2. Select "Build and Release BrightOS" workflow
3. Click "Run workflow"
4. This will create a development release with a timestamp

## Build Configuration

The build is configured in `build.py` with the following PyInstaller options:

- `--onefile`: Creates a single executable file
- `--windowed`: Runs without a console window (GUI mode)
- `--clean`: Cleans PyInstaller cache before building
- `--noconfirm`: Overwrite output directory without confirmation

## Dependencies

The following Python packages are required (see `requirements.txt`):

- `simple-plugin-loader`: For loading plugins
- `sv-ttk`: For the dark theme UI
- `telemetrix-uno-r4-wifi`: For Arduino board communication
- `pyinstaller`: For building the executable

## Troubleshooting

### Build Fails Locally

- Ensure you're on Windows
- Verify Python version is 3.11 or later
- Check that all dependencies are installed: `pip install -r requirements.txt`

### GitHub Actions Build Fails

- Check the Actions tab for error logs
- Verify that the workflow has write permissions for releases
- Ensure the repository has no protected tag rules that prevent the workflow from running

## Directory Structure

```
.
├── BrightOS.py           # Main application
├── build.py              # Build script
├── requirements.txt      # Python dependencies
├── .github/
│   └── workflows/
│       └── build-release.yml  # GitHub Actions workflow
├── build/                # Temporary build files (gitignored)
├── dist/                 # Output directory (gitignored)
└── *.spec                # PyInstaller spec files (gitignored)
```
