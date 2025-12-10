// Network connectivity test for React Native
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const NetworkTest = () => {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const testUrls = [
    'http://192.168.1.6:3000/api/health',
    'http://localhost:3000/api/health',
    'https://httpbin.org/get', // External test
  ];

  const testConnection = async (url) => {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        const data = await response.text();
        return { url, status: 'SUCCESS', data: data.substring(0, 100) };
      } else {
        return { url, status: 'FAILED', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { url, status: 'ERROR', error: error.message };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    for (const url of testUrls) {
      const result = await testConnection(url);
      setResults(prev => [...prev, result]);
      console.log('Test result:', result);
    }
    
    setTesting(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Network Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={runTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Again'}
        </Text>
      </TouchableOpacity>

      {results.map((result, index) => (
        <View key={index} style={styles.result}>
          <Text style={styles.url}>{result.url}</Text>
          <Text style={[
            styles.status,
            { color: result.status === 'SUCCESS' ? 'green' : 'red' }
          ]}>
            {result.status}
          </Text>
          {result.error && (
            <Text style={styles.error}>{result.error}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  result: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  url: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  error: {
    fontSize: 11,
    color: 'red',
    fontStyle: 'italic',
  },
});

export default NetworkTest;
