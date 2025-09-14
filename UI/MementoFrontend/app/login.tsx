import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { CustomLogo } from '@/components/CustomLogo';
import { MementoColors, MementoFontSizes, MementoSpacing, MementoBorderRadius } from '@/constants/mementoTheme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    console.log('Login page - User state changed:', user ? `User: ${user.email}` : 'No user');
    if (user) {
      console.log('User already logged in, redirecting to main app');
      router.replace('/(tabs)');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google sign in...');
      await signInWithGoogle();
      console.log('Sign in completed, checking user state...');
      
      // Wait a bit for the auth state to update
      setTimeout(() => {
        console.log('Checking user state after timeout:', user);
        if (user) {
          console.log('User found after timeout, redirecting...');
          router.replace('/(tabs)');
        } else {
          // Force redirect after 3 seconds if user state is still not updated
          console.log('User state not updated, forcing redirect...');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 1000);
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred during sign in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <CustomLogo size={80} showText={true} />
          <Text style={styles.tagline}>Professional Contact Management</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to MementoAI</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your professional network with intelligent contact insights and seamless organization.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Track meeting frequency</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Smart contact insights</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Secure & private</Text>
          </View>
        </View>

        {/* Sign In Section */}
        <View style={styles.signInSection}>
          <TouchableOpacity 
            style={styles.googleSignInButton} 
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <View style={styles.googleButtonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color={MementoColors.text.primary} />
              ) : (
                <Image 
                  source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                  style={styles.googleIcon}
                />
              )}
              <Text style={styles.googleButtonText}>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.privacyText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>

      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: MementoSpacing.lg,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  tagline: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
    marginTop: MementoSpacing.sm,
    fontWeight: '500',
  },
  welcomeSection: {
    alignItems: 'center',
    marginVertical: MementoSpacing.xl,
  },
  welcomeTitle: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.textPrimary,
    textAlign: 'center',
    marginBottom: MementoSpacing.md,
  },
  welcomeSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: MementoSpacing.md,
  },
  featuresSection: {
    marginVertical: MementoSpacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.md,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.md,
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: MementoSpacing.md,
  },
  featureText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.textPrimary,
    fontWeight: '500',
  },
  signInSection: {
    marginBottom: MementoSpacing.xl,
  },
  googleSignInButton: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    paddingVertical: MementoSpacing.md,
    paddingHorizontal: MementoSpacing.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: MementoSpacing.md,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: MementoSpacing.md,
  },
  googleButtonText: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.textPrimary,
  },
  privacyText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: MementoColors.primary,
    opacity: 0.05,
  },
  circle1: {
    width: 200,
    height: 200,
    top: height * 0.1,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: height * 0.2,
    left: -30,
  },
});
