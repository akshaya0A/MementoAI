import { ContactCard } from '@/components/ContactCard';
import { ContactForm } from '@/components/ContactForm';
import { StatCard } from '@/components/StatCard';
import { DesktopLayout } from '@/components/DesktopLayout';
import { CustomLogo } from '@/components/CustomLogo';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import FirebaseConnectionTest from '@/examples/FirebaseConnectionTest';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useFirebaseContacts();
  const [showAddContact, setShowAddContact] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'contacts' | 'search' | 'export'>('dashboard');
  const router = useRouter();

  const handlePageChange = (page: string) => {
    setCurrentPage(page as any);
    // Navigate to the appropriate page
    switch (page) {
      case 'dashboard':
        router.push('/(tabs)/');
        break;
      case 'contacts':
        router.push('/(tabs)/contacts');
        break;
      case 'search':
        router.push('/(tabs)/search');
        break;
      case 'export':
        router.push('/(tabs)/export');
        break;
    }
  };

  // Sample data for demo purposes
  const sampleContacts = [
    {
      id: '1',
      name: 'Paolo Rossi',
      company: 'TechCorp',
      role: 'Software Engineer',
      whereFrom: 'Milan, Italy',
      whereMet: 'HackMIT Career Fair',
      funFacts: ['Loves proactive people and innovative solutions'],
      notes: [],
      encounters: [
        { date: '2025-01-16', location: 'HackMIT networking booth', notes: 'Met at: HackMIT networking booth' }
      ]
    },
    {
      id: '2',
      name: 'Sarah Chen',
      company: 'StartupXYZ',
      role: 'Product Manager',
      whereFrom: 'San Francisco, CA',
      whereMet: 'Tech Recruiting Dinner',
      funFacts: ['Interested in our mobile app development approach'],
      notes: [],
      encounters: [
        { date: '2025-01-11', location: 'Tech recruiting dinner table', notes: 'Met at: Tech recruiting dinner table' }
      ]
    },
    {
      id: '3',
      name: 'Lisa Park',
      company: 'DataFlow Solutions',
      role: 'Talent Acquisition',
      whereFrom: 'Seattle, WA',
      whereMet: 'AI Summit',
      funFacts: ['Specializes in data science and ML roles'],
      notes: [],
      encounters: [
        { date: '2025-01-14', location: 'AI Summit expo hall', notes: 'Met at: AI Summit expo hall' }
      ]
    },
    {
      id: '4',
      name: 'Alex Rivera',
      company: 'DesignStudio',
      role: 'UX Designer',
      whereFrom: 'Barcelona, Spain',
      whereMet: 'HackMIT',
      funFacts: ['Passionate about accessible design and user research'],
      notes: [],
      encounters: [
        { date: '2025-01-10', location: 'HackMIT design workshop', notes: 'Met at: HackMIT design workshop' }
      ]
    },
    {
      id: '5',
      name: 'Marcus Johnson',
      company: 'MegaTech Inc',
      role: 'Engineering Director',
      whereFrom: 'Austin, TX',
      whereMet: 'CodeConf 2025',
      funFacts: ['Looking for full-stack developers with React experience'],
      notes: [],
      encounters: [
        { date: '2025-01-07', location: 'CodeConf speaker lounge', notes: 'Met at: CodeConf speaker lounge' }
      ]
    }
  ];

  // Use sample data for demo
  const displayContacts = sampleContacts;

  // Get recent encounters (last 8)
  const recentContacts = [...displayContacts]
    .sort((a, b) => {
      const aLatest = Math.max(...a.encounters.map(e => new Date(e.date).getTime()));
      const bLatest = Math.max(...b.encounters.map(e => new Date(e.date).getTime()));
      return bLatest - aLatest;
    })
    .slice(0, 8);

  // Get most seen contacts (by encounter count)
  const mostSeenContacts = [...displayContacts]
    .sort((a, b) => b.encounters.length - a.encounters.length)
    .slice(0, 6);

  const totalContacts = displayContacts.length;
  const totalEncounters = displayContacts.reduce((sum, contact) => sum + contact.encounters.length, 0);
  const recentEncounters = displayContacts.filter(contact =>
    contact.encounters.some(encounter => 
      new Date(encounter.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    )
  ).length;
  const totalNotes = displayContacts.reduce((sum, contact) => sum + contact.notes.length, 0);

  // Enhanced stats with better data
  const stats = {
    contacts: totalContacts,
    encounters: totalEncounters,
    thisWeek: recentEncounters,
    notes: totalNotes,
  };

  const getStatIcon = (key: string) => {
    switch (key) {
      case 'contacts': return 'person.2.fill';
      case 'encounters': return 'handshake.fill';
      case 'thisWeek': return 'calendar.badge.clock';
      case 'notes': return 'pencil.circle.fill';
      default: return 'chart.bar.fill';
    }
  };

  const getStatColor = (key: string) => {
    switch (key) {
      case 'contacts': return MementoColors.stats.contacts;
      case 'encounters': return MementoColors.stats.encounters;
      case 'thisWeek': return MementoColors.stats.thisWeek;
      case 'notes': return MementoColors.stats.notes;
      default: return MementoColors.primary;
    }
  };

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

  const headerActions = (
    <View style={styles.actionButtons}>
      <TouchableOpacity style={styles.importButton} onPress={handleImportContacts}>
        <IconSymbol name="arrow.up.circle" size={16} color={MementoColors.text.primary} />
        <Text style={styles.importButtonText}>Import</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addContactButton} onPress={() => setShowAddContact(true)}>
        <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
        <Text style={styles.addContactButtonText}>Add Contact</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportButton} onPress={handleExportContacts}>
        <IconSymbol name="arrow.down.circle" size={16} color={MementoColors.text.primary} />
        <Text style={styles.exportButtonText}>Export vCard</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DesktopLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      title="Dashboard"
      subtitle="Manage your professional contacts and encounters"
      headerActions={headerActions}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Overview</Text>
            <Text style={styles.statsSubtitle}>Your networking insights</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <StatCard
                title="Total Contacts"
                value={stats.contacts}
                color={getStatColor('contacts')}
                icon={getStatIcon('contacts')}
                trend={stats.contacts > 0 ? '+12%' : undefined}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Encounters"
                value={stats.encounters}
                color={getStatColor('encounters')}
                icon={getStatIcon('encounters')}
                trend={stats.encounters > 0 ? '+8%' : undefined}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="This Week"
                value={stats.thisWeek}
                color={getStatColor('thisWeek')}
                icon={getStatIcon('thisWeek')}
                trend={stats.thisWeek > 0 ? '+3' : undefined}
              />
            </View>
            <View style={styles.statItem}>
              <StatCard
                title="Notes"
                value={stats.notes}
                color={getStatColor('notes')}
                icon={getStatIcon('notes')}
                trend={stats.notes > 0 ? '+5' : undefined}
              />
            </View>
          </View>
        </View>

        {/* Most Seen Section */}
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

        {/* All Recent Encounters Section */}
        <View style={styles.recentEncountersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Recent Encounters</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="person.2" size={48} color={MementoColors.text.muted} />
              <Text style={styles.emptyStateTitle}>No contacts yet</Text>
              <Text style={styles.emptyStateText}>
                Start building your network by importing contacts or adding them manually
              </Text>
              <View style={styles.emptyStateActions}>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <IconSymbol name="arrow.up.circle" size={16} color={MementoColors.text.white} />
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
    </DesktopLayout>
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
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
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.md,
    borderRadius: MementoBorderRadius.md,
    shadowColor: MementoColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginBottom: MementoSpacing.xl,
  },
  statsHeader: {
    marginBottom: MementoSpacing.lg,
  },
  statsTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '700',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    fontWeight: '400',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: MementoSpacing.md,
  },
  statItem: {
    flex: 1,
  },
  mostSeenSection: {
    marginBottom: MementoSpacing.xl,
  },
  recentEncountersSection: {
    marginBottom: MementoSpacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MementoSpacing.lg,
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
    gap: MementoSpacing.md,
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
