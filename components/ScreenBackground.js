import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import homeStyles from '../styles/homeStyles';

export default function ScreenBackground() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={['#F0F9FF', '#F7EFEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={homeStyles.largeCurvedWave} />
      <View style={homeStyles.headerAura} />
      <View style={homeStyles.decorativeShape1} />
      <View style={homeStyles.decorativeShape2} />
      <View style={homeStyles.decorativeShape3} />
    </View>
  );
}
