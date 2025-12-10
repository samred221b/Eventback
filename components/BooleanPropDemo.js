import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeText, SafeScrollView } from './SafeComponents';
import { parseBoolean, parseNumber } from '../utils/dataProcessor';

/**
 * Demonstration component showing all boolean prop fixes
 * This component shows the BEFORE/AFTER of boolean prop issues
 */
export default function BooleanPropDemo() {
  // Simulate problematic props that would cause "String cannot be cast to Boolean"
  const problematicData = {
    mapProps: {
      showsUserLocation: "true",      // ❌ String, would crash
      showsCompass: "false",          // ❌ String, would crash
      zoomEnabled: "true",            // ❌ String, would crash
      minZoomLevel: "10",             // ❌ String, would crash
    },
    markerProps: {
      draggable: "false",             // ❌ String, would crash
      flat: "true",                   // ❌ String, would crash
      opacity: "0.8",                 // ❌ String, would crash
      zIndex: "1000",                 // ❌ String, would crash
    },
    textProps: {
      numberOfLines: "2",             // ❌ String, would crash
      selectable: "true",             // ❌ String, would crash
      allowFontScaling: "false",      // ❌ String, would crash
    }
  };

  // Apply our fixes
  const fixedData = {
    mapProps: {
      showsUserLocation: Boolean(problematicData.mapProps.showsUserLocation === "true"),
      showsCompass: Boolean(problematicData.mapProps.showsCompass === "true"),
      zoomEnabled: Boolean(problematicData.mapProps.zoomEnabled === "true"),
      minZoomLevel: Number(problematicData.mapProps.minZoomLevel),
    },
    markerProps: {
      draggable: Boolean(problematicData.markerProps.draggable === "true"),
      flat: Boolean(problematicData.markerProps.flat === "true"),
      opacity: Number(problematicData.markerProps.opacity),
      zIndex: Number(problematicData.markerProps.zIndex),
    },
    textProps: {
      numberOfLines: Number(problematicData.textProps.numberOfLines),
      selectable: Boolean(problematicData.textProps.selectable === "true"),
      allowFontScaling: Boolean(problematicData.textProps.allowFontScaling === "true"),
    }
  };

  const renderPropComparison = (title, problematic, fixed) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      <View style={styles.comparisonContainer}>
        <View style={styles.beforeContainer}>
          <Text style={styles.beforeTitle}>❌ BEFORE (Would Crash)</Text>
          {Object.entries(problematic).map(([key, value]) => (
            <Text key={key} style={styles.propText}>
              {key}: "{value}" ({typeof value})
            </Text>
          ))}
        </View>
        
        <View style={styles.afterContainer}>
          <Text style={styles.afterTitle}>✅ AFTER (Safe)</Text>
          {Object.entries(fixed).map(([key, value]) => (
            <Text key={key} style={styles.propText}>
              {key}: {String(value)} ({typeof value})
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={Boolean(true)}
      bounces={Boolean(true)}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Boolean Prop Fixes Demo</Text>
        <Text style={styles.subtitle}>
          Preventing "String cannot be cast to Boolean" errors
        </Text>
      </View>

      {renderPropComparison(
        "🗺️ MapView Props", 
        problematicData.mapProps, 
        fixedData.mapProps
      )}

      {renderPropComparison(
        "📍 Marker Props", 
        problematicData.markerProps, 
        fixedData.markerProps
      )}

      {renderPropComparison(
        "📝 Text Props", 
        problematicData.textProps, 
        fixedData.textProps
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛠️ Our Solutions</Text>
        
        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>1. Boolean() Wrapper</Text>
          <Text style={styles.solutionText}>
            showsUserLocation={'{Boolean(true)}'} // Force boolean
          </Text>
        </View>

        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>2. Number() Wrapper</Text>
          <Text style={styles.solutionText}>
            minZoomLevel={'{Number(10)}'} // Force number
          </Text>
        </View>

        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>3. parseBoolean() Function</Text>
          <Text style={styles.solutionText}>
            parseBoolean("true") → true (boolean)
          </Text>
        </View>

        <View style={styles.solutionContainer}>
          <Text style={styles.solutionTitle}>4. Safe Components</Text>
          <Text style={styles.solutionText}>
            SafeMapView, SafeMarker, SafeText validate all props
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✅ Test Results</Text>
        
        <SafeText 
          style={styles.testText}
          numberOfLines={Number(3)} // ✅ Safe: Number, not string
          selectable={Boolean(false)} // ✅ Safe: Boolean, not string
          allowFontScaling={Boolean(true)} // ✅ Safe: Boolean, not string
        >
          This SafeText component demonstrates proper boolean prop usage. 
          All props are explicitly converted to their correct types to prevent 
          native component casting errors.
        </SafeText>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎉 All boolean prop issues resolved!
        </Text>
        <Text style={styles.footerSubtext}>
          No more "String cannot be cast to Boolean" errors
        </Text>
      </View>
    </SafeScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dbeafe',
    textAlign: 'center',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  beforeContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  afterContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  beforeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  afterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  propText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    marginBottom: 4,
  },
  solutionContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  solutionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  solutionText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  testText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#10b981',
    margin: 15,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#d1fae5',
  },
});
