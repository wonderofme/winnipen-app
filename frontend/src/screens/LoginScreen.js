import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LinearGradient,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS, WINNIPEG_TERMS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signIn, signUp, signOut, user } = useAuth();

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Unable to sign in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await signUp(email.trim(), password);
    } catch (error) {
      console.error('Sign up error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Unable to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Sign Up Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.appName}>Winnipen</Text>
            <Text style={styles.tagline}>{WINNIPEG_TERMS.welcome}</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}

            <TouchableOpacity
              style={styles.signInButton}
              onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.signInText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>

            {/* Sign Out Button - Only show if user is signed in */}
            {user && (
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={async () => {
                  try {
                    await signOut();
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setIsSignUp(false);
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }}
              >
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="location" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.featureText}>Tap anywhere on the map to post</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="chatbubbles" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.featureText}>Chat with your neighbors in real-time</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="camera" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.featureText}>Share photos from your area</Text>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for Winnipeg
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING['2xl'],
    paddingTop: WINNIPEG_SPACING['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING['4xl'],
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WINNIPEG_RADIUS['2xl'],
    padding: WINNIPEG_SPACING['2xl'],
    marginBottom: WINNIPEG_SPACING['3xl'],
    ...WINNIPEG_SHADOWS.lg,
  },
  formTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    textAlign: 'center',
    marginBottom: WINNIPEG_SPACING['2xl'],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    height: 56,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: WINNIPEG_RADIUS.xl,
    paddingHorizontal: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.lg,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: WINNIPEG_COLORS.jetsNavy,
    ...WINNIPEG_SHADOWS.sm,
  },
  switchButton: {
    marginTop: WINNIPEG_SPACING.lg,
    alignItems: 'center',
  },
  switchText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
  signOutButton: {
    marginTop: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    paddingHorizontal: WINNIPEG_SPACING.xl,
    backgroundColor: WINNIPEG_COLORS.error,
    borderRadius: WINNIPEG_RADIUS.lg,
    alignItems: 'center',
  },
  signOutText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: WINNIPEG_RADIUS.xl,
    marginBottom: WINNIPEG_SPACING.lg,
    ...WINNIPEG_SHADOWS.xl,
  },
  appName: {
    fontSize: WINNIPEG_TYPOGRAPHY['4xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    marginBottom: WINNIPEG_SPACING.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    color: WINNIPEG_COLORS.jetsWhite,
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: WINNIPEG_SPACING['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: WINNIPEG_RADIUS.xl,
    padding: WINNIPEG_SPACING.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING.lg,
    paddingHorizontal: WINNIPEG_SPACING.sm,
  },
  featureText: {
    marginLeft: WINNIPEG_SPACING.lg,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.jetsWhite,
    flex: 1,
    opacity: 0.9,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    paddingVertical: WINNIPEG_SPACING.lg,
    paddingHorizontal: WINNIPEG_SPACING['3xl'],
    borderRadius: 50, // Oval shape
    width: '100%',
    marginTop: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.lg,
    ...WINNIPEG_SHADOWS.lg,
  },
  signInText: {
    color: WINNIPEG_COLORS.jetsNavy,
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    marginLeft: WINNIPEG_SPACING.md,
  },
  termsText: {
    fontSize: WINNIPEG_TYPOGRAPHY.xs,
    color: WINNIPEG_COLORS.jetsWhite,
    textAlign: 'center',
    lineHeight: WINNIPEG_TYPOGRAPHY.xs * WINNIPEG_TYPOGRAPHY.relaxed,
    opacity: 0.7,
  },
  footer: {
    paddingVertical: WINNIPEG_SPACING['3xl'],
    alignItems: 'center',
  },
  footerText: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.jetsWhite,
    opacity: 0.8,
  },
});

export default LoginScreen;
