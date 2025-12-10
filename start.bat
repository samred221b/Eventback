@echo off
echo Starting Eventopia with IP 192.168.1.6...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.1.6
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.6
npx expo start --host 192.168.1.6 --clear
