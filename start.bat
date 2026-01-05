@echo off
echo Starting Eventopia with IP 192.168.0.153...
set EXPO_DEVTOOLS_LISTEN_ADDRESS=192.168.0.153
set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.0.153
npx expo start --host 192.168.0.153 --clear
