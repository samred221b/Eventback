import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { parseBoolean, parseNumber } from '../utils/dataProcessor';

// Safe Text component that ensures all props are properly typed
export const SafeText = ({ 
  children, 
  numberOfLines, 
  ellipsizeMode = "tail",
  selectable,
  allowFontScaling,
  adjustsFontSizeToFit,
  minimumFontScale,
  ...props 
}) => {
  return (
    <Text
      {...props}
      numberOfLines={numberOfLines ? parseNumber(numberOfLines) : undefined}
      ellipsizeMode={ellipsizeMode}
      selectable={parseBoolean(selectable)}
      allowFontScaling={parseBoolean(allowFontScaling)}
      adjustsFontSizeToFit={parseBoolean(adjustsFontSizeToFit)}
      minimumFontScale={minimumFontScale ? parseNumber(minimumFontScale, 0.01) : undefined}
    >
      {children}
    </Text>
  );
};

// Safe ScrollView component that ensures boolean props are correct
export const SafeScrollView = ({ 
  children,
  horizontal,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  scrollEnabled,
  bounces,
  bouncesZoom,
  alwaysBounceHorizontal,
  alwaysBounceVertical,
  pagingEnabled,
  scrollsToTop,
  automaticallyAdjustContentInsets,
  keyboardDismissMode = "none",
  keyboardShouldPersistTaps = "never",
  ...props 
}) => {
  return (
    <ScrollView
      {...props}
      horizontal={parseBoolean(horizontal)}
      showsHorizontalScrollIndicator={parseBoolean(showsHorizontalScrollIndicator)}
      showsVerticalScrollIndicator={parseBoolean(showsVerticalScrollIndicator)}
      scrollEnabled={scrollEnabled === undefined ? true : parseBoolean(scrollEnabled)}
      bounces={parseBoolean(bounces)}
      bouncesZoom={parseBoolean(bouncesZoom)}
      alwaysBounceHorizontal={parseBoolean(alwaysBounceHorizontal)}
      alwaysBounceVertical={parseBoolean(alwaysBounceVertical)}
      pagingEnabled={parseBoolean(pagingEnabled)}
      scrollsToTop={parseBoolean(scrollsToTop)}
      automaticallyAdjustContentInsets={parseBoolean(automaticallyAdjustContentInsets)}
      keyboardDismissMode={keyboardDismissMode}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  );
};

// Safe TouchableOpacity component
export const SafeTouchableOpacity = ({ 
  children,
  disabled,
  activeOpacity,
  ...props 
}) => {
  return (
    <TouchableOpacity
      {...props}
      disabled={parseBoolean(disabled)}
      activeOpacity={activeOpacity ? parseNumber(activeOpacity, 0.2) : 0.2}
    >
      {children}
    </TouchableOpacity>
  );
};

// Example of common boolean prop issues and their fixes
export const BooleanPropExamples = () => {
  return (
    <View>
      {/* ❌ WRONG - These would cause native crashes */}
      {/* <Text numberOfLines="2" selectable="true">Wrong</Text> */}
      {/* <ScrollView horizontal="true" bounces="false">Wrong</ScrollView> */}
      
      {/* ✅ CORRECT - Properly typed props */}
      <SafeText 
        numberOfLines={2} 
        selectable={true}
        ellipsizeMode="tail"
      >
        This text is properly configured
      </SafeText>
      
      <SafeScrollView 
        horizontal={false} 
        bounces={true}
        showsVerticalScrollIndicator={true}
      >
        <SafeText>Scrollable content</SafeText>
      </SafeScrollView>
    </View>
  );
};
