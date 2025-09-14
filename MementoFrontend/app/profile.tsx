import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { MementoColors, MementoFontSizes, MementoSpacing, MementoBorderRadius } from '../constants/mementoTheme';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ProfileScreen() {
  const { user, firebaseUser, signOut } = useAuth();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <IconSymbol name="chevron.down" size={20} color={MementoColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>

      {/* Profile Content */}
      <View style={styles.profileCard}>
        <View style={styles.profileContent}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          
          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {user?.displayName || 'User'}
            </Text>
            <Text style={styles.email}>
              {user?.email || firebaseUser?.email || 'No email available'}
            </Text>
            <Text style={styles.userId}>
              User ID: {user?.id || firebaseUser?.uid || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="person.circle" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Display Name</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.displayName || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="envelope" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Email</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.email || firebaseUser?.email || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="checkmark.circle" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Email Verified</Text>
            </View>
            <Text style={styles.detailValue}>
              {firebaseUser?.emailVerified ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="calendar" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Last Login</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="paintbrush" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Theme</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.preferences?.theme || 'Light'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="bell" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Notifications</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.preferences?.notifications ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <IconSymbol name="globe" size={16} color={MementoColors.text.muted} />
              <Text style={styles.detailLabelText}>Language</Text>
            </View>
            <Text style={styles.detailValue}>
              {user?.preferences?.language || 'English'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol name="arrow.right.square" size={16} color={MementoColors.text.white} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: MementoSpacing.sm,
    marginRight: MementoSpacing.sm,
  },
  headerTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '600',
    color: MementoColors.text.primary,
  },
  profileCard: {
    backgroundColor: MementoColors.backgroundCard,
    margin: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  profileContent: {
    padding: MementoSpacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MementoSpacing.md,
  },
  avatarText: {
    fontSize: MementoFontSizes.xxxl,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: MementoSpacing.lg,
  },
  name: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
    textAlign: 'center',
  },
  email: {
    fontSize: MementoFontSizes.lg,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.xs,
    textAlign: 'center',
  },
  userId: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
    textAlign: 'center',
  },
  detailsSection: {
    paddingHorizontal: MementoSpacing.lg,
    paddingBottom: MementoSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabelText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginLeft: MementoSpacing.sm,
  },
  detailValue: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    padding: MementoSpacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MementoColors.error,
    paddingVertical: MementoSpacing.md,
    paddingHorizontal: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.md,
    gap: MementoSpacing.sm,
  },
  signOutButtonText: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.white,
  },
});
