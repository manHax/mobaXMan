#!/bin/bash
set -e

echo "🚀 Installing mobaXMan for Linux..."

# NOTE: Change 'yourusername/mobaXMan' to your actual GitHub repository!
REPO="manHax/mobaXMan"

# Fetch latest release URL for AppImage
echo "🔍 Finding latest release..."
API_RESPONSE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")
URL=$(echo "$API_RESPONSE" | grep -o "https://.*\.AppImage" | head -n 1)

if [ -z "$URL" ]; then
  echo "❌ Error: Could not find an AppImage in the latest release of $REPO."
  echo "Make sure you have created a GitHub Release with an attached .AppImage file."
  exit 1
fi

echo "📥 Downloading $URL..."
curl -L -o mobaXMan.AppImage "$URL"

echo "⚙️  Installing to /usr/local/bin/mobaxman..."
chmod +x mobaXMan.AppImage
sudo mv mobaXMan.AppImage /usr/local/bin/mobaxman

echo "✅ Installation complete! You can now run 'mobaxman' from anywhere."
