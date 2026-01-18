import React from 'react';
import { View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import homeStyles from '../styles/homeStyles';
import { useTheme } from '../providers/ThemeProvider';

export default function ScreenBackground() {
  const { width } = Dimensions.get('window');
  const { isDark } = useTheme();

  const gradientColors = isDark
    ? ['#060B14', '#0B1220']
    : ['#F0F9FF', '#F7EFEA'];

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'visible' }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={[
          homeStyles.largeCurvedWave,
          {
            left: -width * 0.55,
            width: width * 2.1,
            right: undefined,
            transform: undefined,
          },
        ]}
      />
      <View
        style={[
          homeStyles.headerAura,
          {
            width: width * 1.6,
          },
        ]}
      />
      <View style={homeStyles.decorativeShape1} />
      <View style={homeStyles.decorativeShape2} />
      <View style={homeStyles.decorativeShape3} />
    </View>
  );
}
