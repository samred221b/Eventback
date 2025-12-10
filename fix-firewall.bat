@echo off
echo Fixing Windows Firewall for Node.js development...
echo.
echo Adding firewall rule to allow port 3000...
netsh advfirewall firewall add rule name="Eventopia Backend" dir=in action=allow protocol=TCP localport=3000
echo.
echo Adding firewall rule to allow port 8081 (Metro)...
netsh advfirewall firewall add rule name="Expo Metro" dir=in action=allow protocol=TCP localport=8081
echo.
echo Adding firewall rule to allow port 19000 (Expo)...
netsh advfirewall firewall add rule name="Expo Dev" dir=in action=allow protocol=TCP localport=19000
echo.
echo Firewall rules added successfully!
echo Your phone should now be able to connect to your backend.
echo.
pause
