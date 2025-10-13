import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ message = 'Loading...' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Scale animation for logo
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Continuous rotation for loading indicator
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[WINNIPEG_COLORS.prairieBeige, WINNIPEG_COLORS.jetsWhite]}
      style={styles.container}
    >
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logo}>
              <Ionicons name="map" size={50} color={WINNIPEG_COLORS.jetsWhite} />
            </View>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.appName}>Winnipen</Text>
          <Text style={styles.appTagline}>Winnipeg's Community Map</Text>
        </View>
        
        {/* Loading Section */}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingWrapper}>
            <Animated.View 
              style={[
                styles.loadingIcon,
                { transform: [{ rotate: rotateInterpolate }] }
              ]}
            >
              <Ionicons name="refresh" size={24} color={WINNIPEG_COLORS.jetsBlue} />
            </Animated.View>
            <ActivityIndicator 
              size="large" 
              color={WINNIPEG_COLORS.jetsBlue} 
              style={styles.spinner}
            />
          </View>
          <Text style={styles.loadingText}>{message}</Text>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>Connecting Winnipeggers</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING['4xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING['6xl'],
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: WINNIPEG_SPACING['2xl'],
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...WINNIPEG_SHADOWS.lg,
    borderWidth: 3,
    borderColor: WINNIPEG_COLORS.jetsWhite,
  },
  logoGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 55,
    backgroundColor: WINNIPEG_COLORS.jetsGold,
    opacity: 0.3,
    zIndex: -1,
  },
  appName: {
    fontSize: WINNIPEG_TYPOGRAPHY['4xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: WINNIPEG_SPACING.sm,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.prairieBrown,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING['6xl'],
  },
  loadingWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: WINNIPEG_SPACING.lg,
  },
  loadingIcon: {
    position: 'absolute',
    zIndex: 2,
  },
  spinner: {
    opacity: 0.3,
  },
  loadingText: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.gray[600],
    textAlign: 'center',
    maxWidth: width * 0.7,
  },
  footer: {
    position: 'absolute',
    bottom: WINNIPEG_SPACING['4xl'],
    alignItems: 'center',
    width: '100%',
  },
  footerLine: {
    width: 60,
    height: 2,
    backgroundColor: WINNIPEG_COLORS.jetsGold,
    marginBottom: WINNIPEG_SPACING.md,
  },
  footerText: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.prairieBrown,
    textAlign: 'center',
  },
});

export default LoadingScreen;





