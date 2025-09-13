import { ContactCard } from '@/components/ContactCard';
import { ContactForm } from '@/components/ContactForm';
import { StatCard } from '@/components/StatCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useFirebaseContacts();
  const [showAddContact, setShowAddContact] = useState(false);

  // Get recent encounters (last 8)
  const recentContacts = [...contacts]
    .sort((a, b) => {
      const aLatest = Math.max(...a.encounters.map(e => new Date(e.date).getTime()));
      const bLatest = Math.max(...b.encounters.map(e => new Date(e.date).getTime()));
      return bLatest - aLatest;
    })
    .slice(0, 8);

  // Get most seen contacts (by encounter count)
  const mostSeenContacts = [...contacts]
    .sort((a, b) => b.encounters.length - a.encounters.length)
    .slice(0, 6);

  // Get recently seen contacts (encounters in last 30 days)
  const recentlySeenContacts = contacts
    .filter(contact => 
      contact.encounters.some(encounter => 
        new Date(encounter.date).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      )
    )
    .sort((a, b) => {
      const aLatest = Math.max(...a.encounters.map(e => new Date(e.date).getTime()));
      const bLatest = Math.max(...b.encounters.map(e => new Date(e.date).getTime()));
      return bLatest - aLatest;
    })
    .slice(0, 6);

  const totalContacts = contacts.length;
  const totalEncounters = contacts.reduce((sum, contact) => sum + contact.encounters.length, 0);
  const recentEncounters = contacts.filter(contact =>
    contact.encounters.some(encounter => 
      new Date(encounter.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    )
  ).length;

  const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
    try {
      await addContact(contactData);
      setShowAddContact(false);
      Alert.alert('Success', 'Contact added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact. Please try again.');
      console.error('Error adding contact:', error);
    }
  };

  const handleImportContacts = () => {
    Alert.alert(
      'Import Contacts',
      'Import functionality would open file picker to select vCard, CSV, or JSON files.',
      [{ text: 'OK' }]
    );
  };

  const handleExportContacts = () => {
    Alert.alert(
      'Export Contacts',
      'Export functionality would generate and share contact files.',
      [{ text: 'OK' }]
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
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

        {/* Dashboard Title */}
        <View style={styles.dashboardHeader}>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Manage your professional contacts and encounters</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.importButton} onPress={handleImportContacts}>
              <IconSymbol name="upload" size={16} color={MementoColors.text.primary} />
              <Text style={styles.importButtonText}>Import</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addContactButton} onPress={() => setShowAddContact(true)}>
              <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
              <Text style={styles.addContactButtonText}>Add Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportContacts}>
              <IconSymbol name="download" size={16} color={MementoColors.text.primary} />
              <Text style={styles.exportButtonText}>Export vCard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatCard
                title="Total Contacts"
                value={totalContacts}
                color={MementoColors.stats.contacts}
                icon="👥"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Total Encounters"
                value={totalEncounters}
                color={MementoColors.stats.encounters}
                icon="🤝"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatCard
                title="This Week"
                value={recentEncounters}
                color={MementoColors.stats.thisWeek}
                icon="📅"
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Notes"
                value={contacts.reduce((sum, contact) => sum + contact.notes.length, 0)}
                color={MementoColors.stats.notes}
                icon="📝"
              />
            </View>
          </View>
        </View>

        {/* Most Seen Section */}
        {mostSeenContacts.length > 0 && (
          <View style={styles.mostSeenSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <IconSymbol name="eye" size={20} color={MementoColors.primary} />
                <Text style={styles.sectionTitle}>Most Seen</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.contactsGrid}>
              {mostSeenContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => console.log('Contact pressed:', contact.name)}
                  showEncounterCount={true}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recently Seen Section */}
        {recentlySeenContacts.length > 0 && (
          <View style={styles.recentlySeenSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <IconSymbol name="clock" size={20} color={MementoColors.success} />
                <Text style={styles.sectionTitle}>Seen Recently</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllButton}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.contactsGrid}>
              {recentlySeenContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => console.log('Contact pressed:', contact.name)}
                  showRecentEncounter={true}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Encounters Section */}
        <View style={styles.recentEncountersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Recent Encounters</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="users" size={48} color={MementoColors.text.muted} />
              <Text style={styles.emptyStateTitle}>No contacts yet</Text>
              <Text style={styles.emptyStateText}>
                Start building your network by importing contacts or adding them manually
              </Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <IconSymbol name="upload" size={16} color={MementoColors.text.white} />
                  <Text style={styles.emptyStateButtonText}>Import Contacts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.emptyStateButtonSecondary}>
                  <IconSymbol name="plus" size={16} color={MementoColors.primary} />
                  <Text style={styles.emptyStateButtonTextSecondary}>Add Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.contactsGrid}>
              {recentContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => console.log('Contact pressed:', contact.name)}
                  showRecentEncounter={true}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      {showAddContact && (
        <ContactForm
          onSave={handleAddContact}
          onCancel={() => setShowAddContact(false)}
        />
      )}
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
    color: MementoColors.text.error,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: MementoSpacing.xs,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  addContactButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
    fontWeight: '600',
    marginLeft: MementoSpacing.xs,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: MementoSpacing.xs,
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
  recentlySeenSection: {
    padding: MementoSpacing.md,
  },
  recentEncountersSection: {
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
  sectionTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
  },
  viewAllButton: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    fontWeight: '600',
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  emptyStateTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginTop: MementoSpacing.md,
    marginBottom: MementoSpacing.sm,
  },
  emptyStateText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textAlign: 'center',
    marginBottom: MementoSpacing.lg,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: MementoSpacing.sm,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
    fontWeight: '600',
    marginLeft: MementoSpacing.xs,
  },
  emptyStateButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.background,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.primary,
  },
  emptyStateButtonTextSecondary: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    fontWeight: '600',
    marginLeft: MementoSpacing.xs,
  },
});
