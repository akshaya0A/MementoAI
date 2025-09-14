import { ContactCard } from '@/components/ContactCard';
import { ContactForm } from '@/components/ContactForm';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [showAddContact, setShowAddContact] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Enhanced Page Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderTop}>
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle}>All Contacts</Text>
            <Text style={styles.pageSubtitle}>{filteredContacts.length} of {contacts.length} contacts in your network</Text>
          </View>
          
          <View style={styles.pageActions}>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]} 
              onPress={() => setViewMode('list')}
            >
              <IconSymbol 
                name="list.bullet" 
                size={16} 
                color={viewMode === 'list' ? MementoColors.primary : MementoColors.text.secondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]} 
              onPress={() => setViewMode('grid')}
            >
              <IconSymbol 
                name="grid" 
                size={16} 
                color={viewMode === 'grid' ? MementoColors.primary : MementoColors.text.secondary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addContactButton}
              onPress={() => setShowAddContact(true)}
            >
              <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
              <Text style={styles.addContactButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts, companies, roles..."
              placeholderTextColor={MementoColors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={16} color={MementoColors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Sort and Filter Controls */}
      <View style={styles.searchAndControls}>

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
            <IconSymbol name="arrow.up.arrow.down" size={16} color={MementoColors.text.secondary} />
            <Text style={styles.sortButtonText}>
              {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  <TouchableOpacity style={styles.emptyStateButton}>
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
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Contact Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddContact}>
        <IconSymbol name="plus" size={24} color={MementoColors.text.white} />
      </TouchableOpacity>

      {/* Contact Form Modals */}
      {showAddContact && (
        <ContactForm
          onSave={handleSaveContact}
          onCancel={() => setShowAddContact(false)}
        />
      )}

      {editingContact && (
        <ContactForm
          contact={editingContact}
          onSave={handleSaveContact}
          onCancel={() => setEditingContact(null)}
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
