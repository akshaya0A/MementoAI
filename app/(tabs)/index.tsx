import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatCard } from '@/components/StatCard';
import { ContactCard } from '@/components/ContactCard';
import { mockContacts, contactStats } from '@/data/sampleContacts';
import { MementoColors, MementoSpacing, MementoFontSizes, MementoBorderRadius } from '@/constants/mementoTheme';

export default function DashboardScreen() {
  const mostSeenContacts = mockContacts.slice(0, 3); // Show top 3 contacts

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

        {/* Dashboard Title */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Manage your professional contacts and encounters</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.importButton}>
              <Text style={styles.importButtonText}>📥 Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addContactButton}>
              <Text style={styles.addContactButtonText}>+ Add Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <Text style={styles.exportButtonText}>📤 Export vCard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatCard
                title="Total Contacts"
                value={contactStats.totalContacts}
                color={MementoColors.stats.contacts}
                icon="👥"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Total Encounters"
                value={contactStats.totalEncounters}
                color={MementoColors.stats.encounters}
                icon="🤝"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatCard
                title="This Week"
                value={contactStats.thisWeek}
                color={MementoColors.stats.thisWeek}
                icon="📅"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Notes"
                value={contactStats.notes}
                color={MementoColors.stats.notes}
                icon="📝"
              />
            </View>
          </View>
        </View>

        {/* Most Seen Section */}
        <View style={styles.mostSeenSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionIcon}>👁️</Text>
              <Text style={styles.sectionTitle}>Most Seen</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {mostSeenContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onPress={() => console.log('Contact pressed:', contact.name)}
            />
          ))}
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
  dashboardHeader: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
  },
  dashboardTitle: {
    fontSize: MementoFontSizes.xxxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  dashboardSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importButton: {
    backgroundColor: MementoColors.backgroundSecondary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  importButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  addContactButton: {
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  addContactButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: MementoColors.backgroundSecondary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  exportButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  statsContainer: {
    padding: MementoSpacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    marginHorizontal: MementoSpacing.xs,
  },
  mostSeenSection: {
    padding: MementoSpacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MementoSpacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: MementoFontSizes.lg,
    marginRight: MementoSpacing.sm,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  viewAllButton: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    fontWeight: '600',
  },
});
