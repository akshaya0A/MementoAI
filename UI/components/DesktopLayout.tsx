import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CustomLogo } from '@/components/CustomLogo';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoColors, MementoSpacing, MementoFontSizes, MementoBorderRadius } from '@/constants/mementoTheme';
import { useAuth } from '@/contexts/AuthContext';

interface DesktopLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'contacts' | 'search' | 'export';
  onPageChange: (page: 'dashboard' | 'contacts' | 'search' | 'export') => void;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  currentPage,
  onPageChange,
  title,
  subtitle,
  headerActions
}) => {
  const { signOut, user } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart.bar.fill' },
    { id: 'contacts', label: 'Contacts', icon: 'users' },
    { id: 'search', label: 'Search', icon: 'magnifyingglass' },
    { id: 'export', label: 'Export', icon: 'square.and.arrow.up' }
  ] as const;

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <CustomLogo size={48} showText={true} />
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {navigationItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                currentPage === item.id && styles.navItemActive
              ]}
              onPress={() => onPageChange(item.id)}
            >
              <IconSymbol 
                name={item.icon}
                size={20} 
                color={currentPage === item.id ? MementoColors.primary : MementoColors.text.secondary} 
              />
              <Text style={[
                styles.navLabel,
                currentPage === item.id && styles.navLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Profile Section */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color={MementoColors.text.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
              <Text style={styles.searchPlaceholder}>Search contacts...</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <IconSymbol name="gearshape" size={20} color={MementoColors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <IconSymbol name="person" size={20} color={MementoColors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <IconSymbol name="questionmark.circle" size={20} color={MementoColors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Content */}
        <View style={styles.pageContent}>
          {/* Page Header */}
          {(title || subtitle || headerActions) && (
            <View style={styles.pageHeader}>
              <View style={styles.pageHeaderLeft}>
                {title && <Text style={styles.pageTitle}>{title}</Text>}
                {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
              </View>
              {headerActions && (
                <View style={styles.pageHeaderRight}>
                  {headerActions}
                </View>
              )}
            </View>
          )}

          {/* Page Body */}
          <View style={styles.pageBody}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: MementoColors.background,
  },
  sidebar: {
    width: 240,
    backgroundColor: MementoColors.backgroundSidebar,
    borderRightWidth: 1,
    borderRightColor: MementoColors.border,
    paddingTop: MementoSpacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.lg,
    marginBottom: MementoSpacing.xl,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.sm,
  },
  logoText: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  logoLabel: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  navigation: {
    paddingHorizontal: MementoSpacing.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MementoSpacing.md,
    paddingHorizontal: MementoSpacing.md,
    borderRadius: MementoBorderRadius.md,
    marginBottom: MementoSpacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: MementoColors.background,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  navLabel: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginLeft: MementoSpacing.sm,
    fontWeight: '500',
  },
  navLabelActive: {
    color: MementoColors.primary,
    fontWeight: '600',
  },
  userSection: {
    marginTop: 'auto',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.md,
    borderTopWidth: 1,
    borderTopColor: MementoColors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: MementoBorderRadius.full,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.sm,
  },
  userAvatarText: {
    fontSize: MementoFontSizes.sm,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
  },
  signOutButton: {
    padding: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  mainContent: {
    flex: 1,
    backgroundColor: MementoColors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
    backgroundColor: MementoColors.background,
  },
  headerLeft: {
    flex: 1,
    maxWidth: 400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border,
  },
  searchPlaceholder: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: MementoSpacing.sm,
    marginLeft: MementoSpacing.sm,
  },
  pageContent: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  pageHeaderLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: MementoFontSizes.xxxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  pageSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    fontWeight: '500',
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageBody: {
    flex: 1,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.lg,
  },
});
