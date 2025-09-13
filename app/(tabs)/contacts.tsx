import { ContactCard } from '@/components/ContactCard';
import { ContactForm } from '@/components/ContactForm';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { mockContacts } from '@/data/sampleContacts';
import { Contact } from '@/types/contact';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortBy = 'name' | 'date' | 'company';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState(mockContacts);
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
          onPress: () => {
            setContacts(prev => prev.filter(contact => contact.id !== contactId));
            Alert.alert('Success', 'Contact deleted successfully!');
          }
        }
      ]
    );
  };

  const handleSaveContact = (contactData: Omit<Contact, 'id'>) => {
    if (editingContact) {
      // Update existing contact
      setContacts(prev => 
        prev.map(contact => 
          contact.id === editingContact.id 
            ? { ...contactData, id: editingContact.id }
            : contact
        )
      );
      setEditingContact(null);
      Alert.alert('Success', 'Contact updated successfully!');
    } else {
      // Add new contact
      const newContact: Contact = {
        ...contactData,
        id: Date.now().toString(),
      };
      setContacts(prev => [...prev, newContact]);
      setShowAddContact(false);
      Alert.alert('Success', 'Contact added successfully!');
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setShowAddContact(true);
  };

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

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>All Contacts</Text>
        <Text style={styles.pageSubtitle}>{contacts.length} contacts in your network</Text>
        
        <TouchableOpacity style={styles.addContactButton}>
          <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
          <Text style={styles.addContactButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Controls */}
      <View style={styles.searchAndControls}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={MementoColors.text.muted}
          />
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
                  <IconSymbol name="users" size={48} color={MementoColors.text.muted} />
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
    marginBottom: MementoSpacing.lg,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    alignSelf: 'flex-end',
  },
  addContactButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
    fontWeight: '600',
    marginLeft: MementoSpacing.xs,
  },
  searchAndControls: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    paddingHorizontal: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    marginBottom: MementoSpacing.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: MementoSpacing.md,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
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
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
