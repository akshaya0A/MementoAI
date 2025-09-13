import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactCard } from '../../components/ContactCard';
import { sampleContacts } from '../../data/sampleContacts';
import { Contact } from '../../types/contact';
import { MementoColors, MementoSpacing, MementoFontSizes, MementoBorderRadius } from '../../constants/mementoTheme';

export default function ContactsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  const filteredContacts = sampleContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={styles.pageSubtitle}>{filteredContacts.length} contacts in your network</Text>
        
        <TouchableOpacity style={styles.addContactButton}>
          <Text style={styles.addContactButtonText}>+ Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={MementoColors.text.muted}
          />
        </View>
      </View>

      {/* View Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Name</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortIcon}>⬇️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewControls}>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'list' && styles.viewButtonActive]}
            onPress={() => setSelectedView('list')}
          >
            <Text style={styles.viewIcon}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewButton, selectedView === 'grid' && styles.viewButtonActive]}
            onPress={() => setSelectedView('grid')}
          >
            <Text style={styles.viewIcon}>⊞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewIcon}>≡</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contacts List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contactsContainer}>
          {filteredContacts.map((contact) => (
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
  },
  searchContainer: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    paddingHorizontal: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  searchIcon: {
    fontSize: MementoFontSizes.md,
    marginRight: MementoSpacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: MementoSpacing.md,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginRight: MementoSpacing.xs,
  },
  sortButton: {
    padding: MementoSpacing.xs,
  },
  sortIcon: {
    fontSize: MementoFontSizes.sm,
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    padding: MementoSpacing.sm,
    marginLeft: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
  },
  viewButtonActive: {
    backgroundColor: MementoColors.primary + '20',
  },
  viewIcon: {
    fontSize: MementoFontSizes.md,
  },
  scrollView: {
    flex: 1,
  },
  contactsContainer: {
    padding: MementoSpacing.md,
  },
});
