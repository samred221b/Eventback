import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import apiService from '../services/api';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('Testing connection...');
    setApiUrl(apiService.baseURL);
    
    try {
      // Test basic network connectivity first
      // console.log('🔍 Testing network connectivity...');
      
      const isConnected = await apiService.testConnection();
      if (isConnected) {
        setConnectionStatus('✅ Connected to backend');
      } else {
        setConnectionStatus('❌ Cannot connect to backend');
        
        // Additional troubleshooting info
        if (Platform.OS !== 'web') {
          // console.log('💡 Troubleshooting tips:');
          // console.log('1. Make sure your computer and phone are on the same WiFi');
          // console.log('2. Check if Windows Firewall is blocking port 3000');
          // console.log('3. Try running: netsh advfirewall firewall add rule name="Node.js" dir=in action=allow protocol=TCP localport=3000');
        }
      }
    } catch (error) {
      setConnectionStatus(`❌ Connection error: ${error.message}`);
      console.error('Connection test error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Connection Test</Text>
      <Text style={styles.platform}>Platform: {Platform.OS}</Text>
      <Text style={styles.url}>API URL: {apiUrl}</Text>
      <Text style={styles.status}>{connectionStatus}</Text>
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  platform: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  url: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ConnectionTest;
