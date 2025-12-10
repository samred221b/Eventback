# 🔧 Backend Connection Debug Guide

## 🎯 Current Status

Your app is configured to connect to: `http://192.168.1.6:3000/api`

### ✅ What's Working:
- Backend server is running on `localhost:3000`
- Network test confirmed `192.168.1.6:3000` is reachable from phone
- API service is correctly configured with your IP address
- Firebase Auth persistence is set up

### ❌ Current Issue:
- Events are not loading
- Error: "Backend not available"

## 🔍 Debug Steps Added

### 1. Removed Early Exit Check
**File**: `screens/EventsScreen.js`
- Removed the `if (!backendConnected)` check that was preventing API calls
- Now the app will attempt to fetch events regardless of connection test status

### 2. Added Debug Logging
**File**: `debug-connection.js`
- Comprehensive connection test script
- Tests 3 different endpoints with detailed logging
- Shows timing, status codes, and response data

### 3. Enhanced API Logging
**File**: `services/api.js`
- Detailed console logs for every API request
- Shows full URL being called
- Logs response data and errors

## 📊 What to Check in Console

When you reload the app, you should see:

```
🔍 Starting Backend Connection Debug...

📋 Test 1: Health Check
🔗 URL: http://192.168.1.6:3000/api/health
⏱️  Duration: XXXms
📊 Status: 200 OK
✅ SUCCESS
📦 Data: {"status":"OK"...}

📋 Test 2: Get Events
🔗 URL: http://192.168.1.6:3000/api/events
⏱️  Duration: XXXms
📊 Status: 200 OK
✅ SUCCESS
📝 Events count: X

🏁 Debug Complete
```

## 🔧 Possible Issues & Solutions

### Issue 1: "Network request failed"
**Solution**: Windows Firewall is blocking the connection
```cmd
# Run as Administrator:
netsh advfirewall firewall add rule name="Eventopia Backend" dir=in action=allow protocol=TCP localport=3000
```

### Issue 2: "Connection timeout"
**Solution**: Backend not running or wrong IP
- Verify backend is running: `cd backend && npm run dev`
- Confirm IP address: Run `ipconfig` and check IPv4 Address

### Issue 3: "HTTP 404"
**Solution**: Route not found
- Check backend routes are properly registered in `server.js`
- Verify `/api/events` endpoint exists

### Issue 4: "HTTP 500"
**Solution**: Backend error
- Check backend console for error messages
- Verify MongoDB connection
- Check backend logs

## 🧪 Manual Testing

### Test 1: From Computer Browser
```
http://localhost:3000/api/health
http://localhost:3000/api/events
```
Should return JSON data

### Test 2: From Phone Browser
```
http://192.168.1.6:3000/api/health
http://192.168.1.6:3000/api/events
```
Should return same JSON data

### Test 3: From Expo App
- Open Events screen
- Check console logs for debug output
- Look for SUCCESS or ERROR messages

## 📝 Next Steps

1. **Reload your app** (press `r` in Expo CLI)
2. **Check the console logs** for the debug output
3. **Share the debug logs** if issues persist
4. **Test manually** in phone browser if needed

## 🎯 Expected Behavior

After fixes, you should see:
```
LOG  🔗 API Service initialized for android
LOG  📡 Backend URL: http://192.168.1.6:3000/api
LOG  📅 Fetching events with params: {}
LOG  🔗 API endpoint: http://192.168.1.6:3000/api/events
LOG  API Request: GET http://192.168.1.6:3000/api/events
LOG  API Response: 200 {success: true, data: [...]}
LOG  📊 Events API response: {success: true, data: [...]}
```

## 🚀 Quick Fixes Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Firewall allows port 3000
- [ ] Phone and computer on same WiFi
- [ ] IP address is correct (192.168.1.6)
- [ ] MongoDB is connected
- [ ] Events exist in database (run seed script if needed)

## 🆘 If Still Not Working

Run the backend seed script to ensure you have data:
```bash
cd backend
node scripts/seed.js
```

Then check MongoDB directly:
```bash
# In MongoDB Compass or shell
use eventopia
db.events.find().limit(5)
```
