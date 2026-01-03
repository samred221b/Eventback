#!/bin/bash

# Eventopia OTA Update Publisher
# Usage: ./scripts/publish-update.sh [message]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default commit message
MESSAGE=${1:-"UI improvements and bug fixes"}

echo -e "${YELLOW}🚀 Publishing Eventopia OTA Update...${NC}"

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Error: app.json not found. Make sure you're in the project root.${NC}"
    exit 1
fi

# Check if expo-cli is installed
if ! command -v expo &> /dev/null; then
    echo -e "${RED}❌ Error: expo-cli not found. Install it with: npm install -g @expo/cli${NC}"
    exit 1
fi

# Check if we're on a clean git status
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes.${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Update cancelled.${NC}"
        exit 1
    fi
fi

# Create a git commit for the update
echo -e "${YELLOW}📝 Creating git commit...${NC}"
git add .
git commit -m "$MESSAGE" || echo -e "${YELLOW}⚠️  No changes to commit${NC}"

# Publish the update
echo -e "${YELLOW}📤 Publishing to Expo...${NC}"
expo publish --non-interactive --release-channel production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Update published successfully!${NC}"
    echo -e "${GREEN}📱 Users will see the update prompt on their next app launch.${NC}"
else
    echo -e "${RED}❌ Failed to publish update${NC}"
    exit 1
fi

# Show update info
echo -e "${YELLOW}📊 Update Information:${NC}"
echo -e "${YELLOW}   • Channel: production${NC}"
echo -e "${YELLOW}   • Message: $MESSAGE${NC}"
echo -e "${YELLOW}   • Check your Expo dashboard for deployment status${NC}"

echo -e "${GREEN}🎉 All done!${NC}"
