import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppConfig } from '../config/AppConfig';

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Initializing...',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />

      {/* Main Center Content */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo Badge */}
          <View style={styles.logoBadge}>
            <Ionicons name="cut" size={42} color="#0284C7" />
          </View>

          {/* App Title & Subtitle */}
          <Text style={styles.brandTitle}>{AppConfig.APP_NAME}</Text>
          <Text style={styles.brandSubtitle}>{AppConfig.APP_SUBTITLE}</Text>
        </Animated.View>
      </View>

      {/* Footer / Loading Status */}
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
        {!!message && <Text style={styles.loadingMessage}>{message}</Text>}
        <Text style={styles.versionText}>v{AppConfig.APP_VERSION}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0284C7',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  animatedContainer: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E0F2FE',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footerContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  spinner: {
    marginBottom: 10,
  },
  loadingMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E0F2FE',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#BAE6FD',
    letterSpacing: 0.5,
  },
});
