import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const { contacts, loading, error } = useFirebaseContacts();

  const features = [
    {
      title: 'Smart Contact Management',
      description: 'Organize your professional network with detailed contact profiles, encounter tracking, and intelligent categorization.',
      icon: 'person.2.fill',
      color: MementoColors.primary
    },
    {
      title: 'Advanced Search & Filtering',
      description: 'Find contacts quickly with powerful search capabilities across names, companies, events, and custom tags.',
      icon: 'magnifyingglass',
      color: MementoColors.info
    },
    {
      title: 'Encounter Tracking',
      description: 'Record and track your interactions with contacts to build stronger professional relationships.',
      icon: 'calendar.badge.plus',
      color: MementoColors.success
    },
    {
      title: 'Export & Integration',
      description: 'Export your contacts in multiple formats (vCard, CSV, JSON) for seamless integration with other tools.',
      icon: 'square.and.arrow.up',
      color: MementoColors.warning
    }
  ];

  const stats = [
    { label: 'Total Contacts', value: contacts.length, icon: 'person.2' },
    { label: 'Total Encounters', value: contacts.reduce((sum, contact) => sum + contact.encounters.length, 0), icon: 'hand.raised' },
    { label: 'Active Tags', value: new Set(contacts.flatMap(c => c.tags)).size, icon: 'tag' },
    { label: 'Companies', value: new Set(contacts.map(c => c.company)).size, icon: 'building.2' }
  ];

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>M</Text>
            </View>
            <Text style={styles.title}>MementoAI</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Text style={styles.headerButtonText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Explore MementoAI</Text>
          <Text style={styles.pageSubtitle}>Discover the power of professional contact management</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Network Overview</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <IconSymbol name={stat.icon as any} size={24} color={MementoColors.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <IconSymbol name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="plus" size={20} color={MementoColors.primary} />
              <Text style={styles.actionText}>Add Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="magnifyingglass" size={20} color={MementoColors.info} />
              <Text style={styles.actionText}>Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="square.and.arrow.up" size={20} color={MementoColors.warning} />
              <Text style={styles.actionText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="gear" size={20} color={MementoColors.text.secondary} />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MementoSpacing.lg,
  },
  loadingText: {
    fontSize: MementoFontSizes.lg,
    color: MementoColors.text.primary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MementoSpacing.lg,
  },
  errorText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.error,
    textAlign: 'center',
    marginBottom: MementoSpacing.md,
  },
  retryButton: {
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  retryButtonText: {
    color: MementoColors.text.white,
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.sm,
  },
  logo: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  title: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: MementoSpacing.sm,
    padding: MementoSpacing.sm,
  },
  headerButtonText: {
    fontSize: MementoFontSizes.lg,
  },
  pageHeader: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
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
  },
  statsSection: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    marginBottom: MementoSpacing.sm,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: MementoColors.backgroundCard,
    padding: MementoSpacing.md,
    borderRadius: MementoBorderRadius.lg,
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  statValue: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginTop: MementoSpacing.xs,
  },
  statLabel: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textAlign: 'center',
    marginTop: MementoSpacing.xs,
  },
  featuresSection: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    marginBottom: MementoSpacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: MementoColors.backgroundCard,
    padding: MementoSpacing.md,
    borderRadius: MementoBorderRadius.lg,
    marginBottom: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: MementoBorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  featureDescription: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    lineHeight: 20,
  },
  actionsSection: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    marginBottom: MementoSpacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: MementoColors.backgroundCard,
    padding: MementoSpacing.md,
    borderRadius: MementoBorderRadius.lg,
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  actionText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
    marginTop: MementoSpacing.xs,
  },
});