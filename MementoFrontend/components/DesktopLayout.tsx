import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '../constants/mementoTheme';
import { IconSymbol } from './ui/icon-symbol';

interface DesktopLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  title: string;
  subtitle: string;
  headerActions?: React.ReactNode;
}

export function DesktopLayout({ 
  children, 
  currentPage, 
  onPageChange, 
  title, 
  subtitle, 
  headerActions 
}: DesktopLayoutProps) {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push('/profile');
  };
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'house' },
    { id: 'contacts', label: 'Contacts', icon: 'person.2' },
    { id: 'search', label: 'Search', icon: 'magnifyingglass' },
    { id: 'export', label: 'Export', icon: 'square.and.arrow.up' },
  ];

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>M</Text>
          </View>
          <Text style={styles.sidebarTitle}>MementoAI</Text>
        </View>
        
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
                color={currentPage === item.id ? MementoColors.primary : MementoColors.text.muted} 
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
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>M</Text>
            </View>
            <Text style={styles.headerTitle}>MementoAI</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton} onPress={handleProfilePress}>
              <IconSymbol name="person.circle" size={20} color={MementoColors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <View style={styles.contentTitleContainer}>
              <Text style={styles.contentTitle}>{title}</Text>
              <Text style={styles.contentSubtitle}>{subtitle}</Text>
            </View>
            {headerActions && (
              <View style={styles.contentActions}>
                {headerActions}
              </View>
            )}
          </View>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: MementoColors.backgroundSecondary,
  },
  sidebar: {
    width: 200,
    backgroundColor: MementoColors.backgroundSidebar,
    borderRightWidth: 1,
    borderRightColor: MementoColors.border.light,
    paddingTop: MementoSpacing.lg,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    marginBottom: MementoSpacing.lg,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  logo: {
    fontSize: MementoFontSizes.md,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  sidebarTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  navigation: {
    paddingHorizontal: MementoSpacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
    paddingHorizontal: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.sm,
    marginBottom: MementoSpacing.xs,
  },
  navItemActive: {
    backgroundColor: MementoColors.primary + '10',
  },
  navLabel: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.md,
    fontWeight: '500',
  },
  navLabelActive: {
    color: MementoColors.primary,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.xl,
    paddingVertical: MementoSpacing.lg,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
    ...MementoShadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.md,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 400,
    marginHorizontal: MementoSpacing.xl,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.lg,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    width: 300,
  },
  searchInput: {
    flex: 1,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: MementoSpacing.sm,
    marginLeft: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: MementoSpacing.xl,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: MementoSpacing.xl,
  },
  contentTitleContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
  },
  contentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
});
