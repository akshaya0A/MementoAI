import { ContactCard } from '../../components/ContactCard';
import { ContactForm } from '../../components/ContactForm';
import { DesktopLayout } from '../../components/DesktopLayout';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '../../constants/mementoTheme';
import { useFirebaseContacts } from '../../hooks/useFirebaseContacts';
import { callDeepResearchAPI } from '../../lib/firebaseService';
import { Contact } from '../../types/contact';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortBy = 'name' | 'date' | 'company';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function ContactsScreen() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useFirebaseContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'contacts' | 'search' | 'export'>('contacts');
  const router = useRouter();

  const handlePageChange = (page: string) => {
    setCurrentPage(page as any);
    // Navigate to the appropriate page
    switch (page) {
      case 'dashboard':
        router.push('/');
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

  const handleViewContactDetail = (contact: Contact) => {
    router.push(`/contact-detail?contactId=${contact.id}`);
  };

  const handleDeepResearchToggle = async (contactId: string, enabled: boolean) => {
    try {
      // Update the contact in Firebase with the new deep research state
      const contactToUpdate = contacts.find(c => c.id === contactId);
      if (contactToUpdate) {
        const updates: Partial<Contact> = {
          deepResearchEnabled: enabled,
          updatedAt: new Date()
        };
        
        if (enabled) {
          // Call the deep research API
          try {
            console.log(`Starting deep research for contact: ${contactToUpdate.name} (${contactId})`);
            
            // Create a summary from available contact data
            const summary = `${contactToUpdate.role} at ${contactToUpdate.company}. Met at: ${contactToUpdate.whereMet}. From: ${contactToUpdate.whereFrom}. ${contactToUpdate.notes.length > 0 ? `Notes: ${contactToUpdate.notes.map(n => n.content).join(' ')}` : ''}`;
            
            const deepResearchData = await callDeepResearchAPI(contactToUpdate.name, summary);
            
            // Update the contact with both the enabled state and the API response data
            updates.deepResearchData = deepResearchData;
            
            console.log(`Deep research completed for contact: ${contactToUpdate.name}`);
          } catch (apiError) {
            console.error('Deep research API call failed:', apiError);
            Alert.alert('Error', 'Failed to perform deep research. Please try again.');
            return; // Don't update the contact if API call fails
          }
        } else {
          console.log(`Deep research disabled for contact: ${contactToUpdate.name} (${contactId})`);
        }
        
        await updateContact(contactId, updates);
      }
    } catch (error) {
      console.error('Failed to update deep research state:', error);
      Alert.alert('Error', 'Failed to update deep research setting. Please try again.');
    }
  };

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => {
      if (searchQuery === '') return true;
      return (
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.whereFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.whereMet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.funFacts.some(fact => fact.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'date':
          const aLatest = Math.max(...a.encounters.map(e => new Date(e.date).getTime()));
          const bLatest = Math.max(...b.encounters.map(e => new Date(e.date).getTime()));
          comparison = aLatest - bLatest;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(contactId);
              Alert.alert('Success', 'Contact deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
              console.error('Error deleting contact:', error);
            }
          }
        }
      ]
    );
  };

  const handleSaveContact = async (contactData: Omit<Contact, 'id'>) => {
    try {
      if (editingContact) {
        // Update existing contact
        await updateContact(editingContact.id, contactData);
        setEditingContact(null);
        Alert.alert('Success', 'Contact updated successfully!');
      } else {
        // Add new contact
        await addContact(contactData);
        setShowAddContact(false);
        Alert.alert('Success', 'Contact added successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
      console.error('Error saving contact:', error);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowAddContact(true);
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
      <TouchableOpacity 
        style={styles.addContactButton}
        onPress={() => setIsAddContactOpen(true)}
      >
        <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
        <Text style={styles.addContactButtonText}>Add Contact</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <DesktopLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      title="All Contacts"
      subtitle={`${contacts.length} contacts in your network`}
      headerActions={headerActions}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search and Controls */}
        <View style={styles.searchAndControls}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                placeholderTextColor={MementoColors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Sort and View Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                const sortOptions: SortBy[] = ['name', 'company', 'date'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Text>
              <IconSymbol name="arrow.up.arrow.down" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOrderButton}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <IconSymbol 
                name={sortOrder === 'asc' ? "chevron.up" : "chevron.down"} 
                size={16} 
                color={MementoColors.text.secondary} 
              />
            </TouchableOpacity>

            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                onPress={() => setViewMode('grid')}
              >
                <IconSymbol name="square.grid.2x2" size={16} color={MementoColors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <IconSymbol name="list.bullet" size={16} color={MementoColors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyState}>
              {contacts.length === 0 ? (
                <>
                  <IconSymbol name="person.2" size={48} color={MementoColors.text.muted} />
                  <Text style={styles.emptyStateTitle}>No contacts yet</Text>
                  <Text style={styles.emptyStateText}>
                    Start building your professional network by adding contacts
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyStateButton}
                    onPress={() => setIsAddContactOpen(true)}
                  >
                    <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
                    <Text style={styles.emptyStateButtonText}>Add Your First Contact</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <IconSymbol name="magnifyingglass" size={48} color={MementoColors.text.muted} />
                  <Text style={styles.emptyStateTitle}>No contacts found</Text>
                  <Text style={styles.emptyStateText}>
                    Try adjusting your search terms
                  </Text>
                  <TouchableOpacity style={styles.emptyStateButton} onPress={() => setSearchQuery('')}>
                    <Text style={styles.emptyStateButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
              </Text>
              <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onPress={() => handleEditContact(contact)}
                    onEdit={() => handleEditContact(contact)}
                    onDelete={() => handleDeleteContact(contact.id)}
                    onViewDetail={handleViewContactDetail}
                    onDeepResearchToggle={handleDeepResearchToggle}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Contact Form Modals */}
      <Modal
        visible={isAddContactOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ContactForm
          onSave={handleSaveContact}
          onCancel={() => setIsAddContactOpen(false)}
        />
      </Modal>

      {editingContact && (
        <Modal
          visible={!!editingContact}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <ContactForm
            contact={editingContact}
            onSave={handleSaveContact}
            onCancel={() => setEditingContact(null)}
          />
        </Modal>
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
  pageHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: MementoSpacing.md,
  },
  pageTitleContainer: {
    flex: 1,
  },
  pageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
  viewModeButton: {
    padding: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  viewModeButtonActive: {
    backgroundColor: MementoColors.primary + '10',
    borderColor: MementoColors.primary,
  },
  pageTitle: {
    fontSize: MementoFontSizes.xxxl,
    fontWeight: '800',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.lg,
    fontWeight: '500',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.md,
    borderRadius: MementoBorderRadius.lg,
    alignSelf: 'flex-end',
    shadowColor: MementoColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addContactButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
    fontWeight: '700',
    marginLeft: MementoSpacing.xs,
    letterSpacing: 0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
  searchAndControls: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  searchContainer: {
    marginBottom: MementoSpacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.lg,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    gap: MementoSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  sortButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.xs,
  },
  sortOrderButton: {
    padding: MementoSpacing.sm,
    marginLeft: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  viewButton: {
    padding: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.sm,
  },
  viewButtonActive: {
    backgroundColor: MementoColors.primary + '20',
  },
  scrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: MementoSpacing.md,
  },
  resultsCount: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listContainer: {
    gap: MementoSpacing.sm,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: MementoColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
});
