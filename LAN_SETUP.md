# 📱 Eventopia - LAN Setup Guide

## 🎯 **Quick LAN Setup**

Your app is now configured to use LAN networking so the QR code will work properly from your phone.

## 🚀 **How to Start**

### **Step 1: Start Your App**
```bash
npm start
```
- **QR code will now show your network IP** (not localhost)
- **Scan with Expo Go** from your phone
- **Both devices must be on same WiFi**

### **Step 2: Find Your IP Address**
1. **Open Command Prompt**
2. **Run**: `ipconfig`
3. **Look for "IPv4 Address"** (e.g., `192.168.1.100`)

### **Step 3: Update Backend API URL**
In `services/api.js`, replace `YOUR_IP_ADDRESS` with your actual IP:

```javascript
// Replace this line:
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api'

// With your actual IP:
const API_BASE_URL = 'http://192.168.1.100:3000/api'
```

### **Step 4: Start Backend Server**
```bash
cd backend
npm run dev
```

## 🔧 **Configuration Files**

### **✅ Already Configured:**
- `app.json` - Expo LAN settings
- `metro.config.js` - Metro bundler LAN support
- `backend/server.js` - CORS for any IP
- `package.json` - Default LAN start script

## 🎯 **Testing**

1. **Start backend**: `cd backend && npm run dev`
2. **Start app**: `npm start` (from root directory)
3. **Scan QR code** with Expo Go
4. **Test features**:
   - Login/signup
   - View events
   - Create events

## 🔄 **Alternative: Tunnel Mode**

If LAN doesn't work:
```bash
npm run start:tunnel
```
- **Works from anywhere**
- **No IP configuration needed**
- **Slower but more reliable**

## ✅ **What Works Now**

- ✅ **QR code uses network IP** (not localhost)
- ✅ **Phone can connect** to development server
- ✅ **Backend integration** ready
- ✅ **All app features** functional

## 🎉 **You're Ready!**

Your app now properly uses LAN networking. Just:
1. **Update your IP** in `services/api.js`
2. **Start backend server**
3. **Run `npm start`**
4. **Scan QR code** from phone

**Happy coding!** 🚀
