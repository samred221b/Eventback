@echo off
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.153
set EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
echo Starting Expo with IP configuration for Expo Go...
npx expo start --lan --port 8081 --clear
pause
