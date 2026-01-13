"""
BrightOS Launcher
This launcher will:
1. Check for and install/update BrightOS to the latest version from GitHub
2. Install any missing dependencies
3. Create all necessary directories for BrightOS
4. Run BrightOS.py
"""
import os
import sys
import subprocess
import json
import urllib.request
import urllib.error
import zipfile
import shutil
from pathlib import Path
import tempfile


def get_user_dir():
    """Get the user's home directory"""
    return os.path.expanduser("~")


def get_brightos_dir():
    """Get the BrightOS installation directory"""
    userdir = get_user_dir()
    if sys.platform == "win32":
        return os.path.join(userdir, "AppData", "Local", "BrightOS")
    else:
        # For other platforms, use a hidden directory in home
        return os.path.join(userdir, ".brightos")


def create_directories():
    """Create all necessary directories for BrightOS"""
    brightos_dir = get_brightos_dir()
    
    directories = [
        brightos_dir,
        os.path.join(brightos_dir, "Plugins"),
        os.path.join(brightos_dir, "Scripts"),
        os.path.join(brightos_dir, "install")
    ]
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✓ Directory created/verified: {directory}")
        except Exception as e:
            print(f"✗ Error creating directory {directory}: {e}")
            return False
    
    # Create Importlist.txt if it doesn't exist
    importlist_path = os.path.join(brightos_dir, "Importlist.txt")
    if not os.path.exists(importlist_path):
        try:
            with open(importlist_path, 'w') as f:
                f.write("# BrightOS Import List\n")
            print(f"✓ Created: {importlist_path}")
        except Exception as e:
            print(f"✗ Error creating Importlist.txt: {e}")
    
    return True


def get_latest_release_info():
    """Get the latest release information from GitHub"""
    api_url = "https://api.github.com/repos/TheCrazy8/Blaze-And-Company-Official/releases/latest"
    
    try:
        print("Checking for latest BrightOS version...")
        with urllib.request.urlopen(api_url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("No releases found. Using repository main branch.")
            return None
        else:
            print(f"Error checking for updates: {e}")
            return None
    except Exception as e:
        print(f"Error checking for updates: {e}")
        return None


def download_file(url, dest_path):
    """Download a file from a URL to a destination path"""
    try:
        print(f"Downloading from {url}...")
        with urllib.request.urlopen(url, timeout=30) as response:
            with open(dest_path, 'wb') as f:
                f.write(response.read())
        print(f"✓ Downloaded to {dest_path}")
        return True
    except Exception as e:
        print(f"✗ Error downloading: {e}")
        return False


def download_and_extract_release(install_dir):
    """Download and extract the latest BrightOS release"""
    # Try to get the latest release
    release_info = get_latest_release_info()
    
    if release_info:
        # Get the zipball URL from the release
        tag_name = release_info.get('tag_name', 'latest')
        zipball_url = release_info.get('zipball_url')
        
        if not zipball_url:
            print("No download URL found in release. Falling back to main branch.")
            zipball_url = "https://github.com/TheCrazy8/Blaze-And-Company-Official/archive/refs/heads/main.zip"
            tag_name = "main"
        
        print(f"Found version: {tag_name}")
    else:
        # Fallback to main branch
        zipball_url = "https://github.com/TheCrazy8/Blaze-And-Company-Official/archive/refs/heads/main.zip"
        tag_name = "main"
        print("Using main branch")
    
    # Download the zip file
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, "brightos.zip")
        
        if not download_file(zipball_url, zip_path):
            return False
        
        # Extract the zip file
        print("Extracting files...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Find the extracted directory (GitHub zips have a top-level directory)
            extracted_dirs = [d for d in os.listdir(temp_dir) if os.path.isdir(os.path.join(temp_dir, d))]
            if not extracted_dirs:
                print("✗ No directory found in zip file")
                return False
            
            source_dir = os.path.join(temp_dir, extracted_dirs[0])
            
            # Copy necessary files to install directory
            files_to_copy = ['BrightOS.py', 'requirements.txt', 'build.py']
            
            for file_name in files_to_copy:
                source_file = os.path.join(source_dir, file_name)
                if os.path.exists(source_file):
                    dest_file = os.path.join(install_dir, file_name)
                    shutil.copy2(source_file, dest_file)
                    print(f"✓ Copied: {file_name}")
                else:
                    print(f"⚠ File not found: {file_name}")
            
            # Copy favicon.ico if it exists
            favicon_source = os.path.join(source_dir, 'docs', 'public', 'favicon.ico')
            if os.path.exists(favicon_source):
                favicon_dest = os.path.join(install_dir, 'favicon.ico')
                shutil.copy2(favicon_source, favicon_dest)
                print(f"✓ Copied: favicon.ico")
            
            # Save version info
            version_file = os.path.join(install_dir, "version.txt")
            with open(version_file, 'w') as f:
                f.write(tag_name)
            print(f"✓ Installed version: {tag_name}")
            
            return True
            
        except Exception as e:
            print(f"✗ Error extracting files: {e}")
            return False


def install_dependencies(install_dir):
    """Install Python dependencies from requirements.txt"""
    requirements_path = os.path.join(install_dir, "requirements.txt")
    
    if not os.path.exists(requirements_path):
        print("⚠ requirements.txt not found, skipping dependency installation")
        return True
    
    print("\nInstalling dependencies...")
    try:
        # Use pip to install requirements
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "-r", requirements_path,
            "--upgrade"
        ])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        return False


def run_brightos(install_dir):
    """Run BrightOS.py"""
    brightos_path = os.path.join(install_dir, "BrightOS.py")
    
    if not os.path.exists(brightos_path):
        print(f"✗ BrightOS.py not found at {brightos_path}")
        return False
    
    print("\nStarting BrightOS...")
    try:
        # Run BrightOS.py with Python
        subprocess.run([sys.executable, brightos_path])
        return True
    except Exception as e:
        print(f"✗ Error running BrightOS: {e}")
        return False


def check_for_updates(install_dir):
    """Check if an update is available"""
    version_file = os.path.join(install_dir, "version.txt")
    
    if not os.path.exists(version_file):
        return True  # No version file means we should install
    
    # Read current version
    with open(version_file, 'r') as f:
        current_version = f.read().strip()
    
    # Get latest version
    release_info = get_latest_release_info()
    if release_info:
        latest_version = release_info.get('tag_name', 'unknown')
        if latest_version != current_version:
            print(f"Update available: {current_version} → {latest_version}")
            return True
        else:
            print(f"Already up to date: {current_version}")
            return False
    
    # If we can't check, assume no update needed
    return False


def check_directories_exist():
    """Check if all necessary directories exist"""
    brightos_dir = get_brightos_dir()
    
    directories = [
        brightos_dir,
        os.path.join(brightos_dir, "Plugins"),
        os.path.join(brightos_dir, "Scripts"),
        os.path.join(brightos_dir, "install")
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            return False
    
    # Check if Importlist.txt exists
    importlist_path = os.path.join(brightos_dir, "Importlist.txt")
    if not os.path.exists(importlist_path):
        return False
    
    return True


def check_dependencies_installed(install_dir):
    """Check if dependencies are installed by checking pip list"""
    requirements_path = os.path.join(install_dir, "requirements.txt")
    
    if not os.path.exists(requirements_path):
        return True  # No requirements file, assume OK
    
    try:
        # Read requirements
        with open(requirements_path, 'r') as f:
            requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        if not requirements:
            return True
        
        # Get list of installed packages
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format=freeze"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            return False
        
        installed_packages = result.stdout.lower()
        
        # Check each requirement
        for req in requirements:
            # Extract package name (before any version specifier)
            package_name = req.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].strip().lower()
            
            # Skip pyinstaller check as it's only needed for building
            if package_name == 'pyinstaller':
                continue
            
            # Normalize package name (pip list may use underscores or dashes)
            # Check both forms to be safe
            package_with_dash = package_name
            package_with_underscore = package_name.replace('-', '_')
            
            # Check if package is in the installed list (either form)
            if package_with_dash not in installed_packages and package_with_underscore not in installed_packages:
                return False
        
        return True
    except Exception as e:
        # If we can't check, assume dependencies need to be installed
        return False


def main():
    """Main launcher function"""
    brightos_dir = get_brightos_dir()
    install_dir = os.path.join(brightos_dir, "install")
    brightos_path = os.path.join(install_dir, "BrightOS.py")
    
    # Quick checks to see if we can just launch directly
    directories_ok = check_directories_exist()
    brightos_installed = os.path.exists(brightos_path)
    
    # If everything is in place, check for updates but don't show full setup
    if directories_ok and brightos_installed:
        # Quick mode - just check for updates and dependencies
        needs_update = check_for_updates(install_dir)
        deps_ok = check_dependencies_installed(install_dir)
        
        if not needs_update and deps_ok:
            # Everything is ready, just launch
            print("Starting BrightOS...")
            run_brightos(install_dir)
            return 0
        else:
            # Need to do some updates
            print("=" * 50)
            print("BrightOS Launcher - Update Required")
            print("=" * 50)
            print()
            
            if needs_update:
                print("Updating BrightOS...")
                if not download_and_extract_release(install_dir):
                    print("⚠ Update failed, using existing installation")
                print()
            
            if not deps_ok:
                print("Installing missing dependencies...")
                if not install_dependencies(install_dir):
                    print("⚠ Dependency installation had issues, but continuing...")
                print()
            
            print("Starting BrightOS...")
            print("=" * 50)
            print()
            run_brightos(install_dir)
            return 0
    
    # Full setup mode - first time or missing components
    print("=" * 50)
    print("BrightOS Launcher - First Time Setup")
    print("=" * 50)
    print()
    
    # Step 1: Create directories
    if not directories_ok:
        print("Step 1: Creating directories...")
        if not create_directories():
            print("\n✗ Failed to create directories")
            input("Press Enter to exit...")
            return 1
        print()
    
    # Step 2: Check for updates and install/update BrightOS
    needs_install = not os.path.exists(brightos_path)
    
    if needs_install:
        print("Step 2: Installing BrightOS...")
        if not download_and_extract_release(install_dir):
            print("\n✗ Failed to install BrightOS")
            input("Press Enter to exit...")
            return 1
        print()
    
    # Step 3: Install dependencies
    print("Step 3: Installing dependencies...")
    if not install_dependencies(install_dir):
        print("\n⚠ Dependency installation had issues, but continuing...")
    print()
    
    # Step 4: Run BrightOS
    print("Step 4: Starting BrightOS...")
    print("=" * 50)
    print()
    
    run_brightos(install_dir)
    
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nLauncher interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
        sys.exit(1)
