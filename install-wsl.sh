#!/bin/bash
set -e

echo "🚀 Installing mobaXMan specifically for WSL..."

# NOTE: Change 'yourusername/mobaXMan' to your actual GitHub repository!
REPO="manHax/mobaXMan"

# 1. Install necessary dependencies for WSL (keyring, dbus, libsecret)
echo "📦 Installing required dependencies (you may be prompted for sudo password)..."
sudo apt update
sudo apt install -y libsecret-1-0 gnome-keyring dbus-x11 curl

# 2. Fetch latest release URL for AppImage
echo "🔍 Finding latest release..."
API_RESPONSE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")
URL=$(echo "$API_RESPONSE" | grep -o "https://.*\.AppImage" | head -n 1)

if [ -z "$URL" ]; then
  echo "❌ Error: Could not find an AppImage in the latest release."
  exit 1
fi

# 3. Download and Extract (to bypass FUSE issues in WSL)
echo "📥 Downloading $URL..."
TMP_DIR=$(mktemp -d)
cd $TMP_DIR
curl -L -o mobaXMan.AppImage "$URL"
chmod +x mobaXMan.AppImage

echo "📂 Extracting AppImage (bypassing FUSE)..."
./mobaXMan.AppImage --appimage-extract > /dev/null

echo "⚙️ Moving to /opt/mobaxman-wsl..."
sudo rm -rf /opt/mobaxman-wsl
sudo mv squashfs-root /opt/mobaxman-wsl

# 4. Create the wrapper script
echo "📝 Creating WSL wrapper script..."
WRAPPER_SCRIPT="/usr/local/bin/mobaxman-wsl"
sudo bash -c "cat > $WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
# Start DBUS if not running
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    export $(dbus-launch)
fi

# Start Gnome Keyring if not running
if ! pgrep -x "gnome-keyring-d" > /dev/null; then
    eval $(echo -n "" | gnome-keyring-daemon --unlock)
fi

# Run the extracted AppImage with no-sandbox (required for Electron in WSL)
/opt/mobaxman-wsl/AppRun --no-sandbox "$@"
EOF

sudo chmod +x $WRAPPER_SCRIPT

# Cleanup
cd - > /dev/null
rm -rf $TMP_DIR

echo "✅ WSL Installation complete!"
echo "🎯 You can now run mobaXMan in WSL by typing: mobaxman-wsl"
