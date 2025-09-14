import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { MementoColors } from '@/constants/mementoTheme';

export default function Index() {
  const { user, loading } = useAuth();

  console.log('Index component - Loading:', loading, 'User:', user ? user.email : 'No user');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MementoColors.primary} />
      </View>
    );
  }

  if (user) {
    console.log('Redirecting to main app for user:', user.email);
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('Redirecting to login page');
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MementoColors.background,
  },
});
