import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const EmptyState = ({
  icon = 'inbox',
  iconSize = 64,
  title = 'No Data Available',
  description = 'There is no data to display at the moment.',
  primaryAction = null,
  primaryActionText = 'Action',
  primaryActionIcon = 'arrow-right',
  secondaryAction = null,
  secondaryActionText = 'Secondary',
  secondaryActionIcon = 'refresh-cw',
  illustration = null,
  gradientColors = ['#0277BD', '#01579B'],
  showIllustration = false,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Illustration or Icon */}
        {showIllustration && illustration ? (
          <View style={styles.illustrationContainer}>
            <Image 
              source={illustration} 
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Feather name={icon} size={iconSize} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>

        {/* Action Buttons */}
        {(primaryAction || secondaryAction) && (
          <View style={styles.actionsContainer}>
            {primaryAction && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={primaryAction}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Feather name={primaryActionIcon} size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{primaryActionText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            {secondaryAction && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={secondaryAction}
                activeOpacity={0.8}
              >
                <Feather name={secondaryActionIcon} size={18} color="#0277BD" />
                <Text style={styles.secondaryButtonText}>{secondaryActionText}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  illustrationContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  illustration: {
    width: 200,
    height: 200,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0277BD',
  },
});

export default EmptyState;
