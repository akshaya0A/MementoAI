import { ContactCard } from '@/components/ContactCard';
import { DesktopLayout } from '@/components/DesktopLayout';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';

export default function ExportScreen() {
  const { contacts, loading, error } = useFirebaseContacts();
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'contacts' | 'search' | 'export'>('export');
  const router = useRouter();

  const handlePageChange = (page: string) => {
    setCurrentPage(page as any);
    switch (page) {
      case 'dashboard': router.push('/'); break;
      case 'contacts': router.push('/contacts'); break;
      case 'search': router.push('/search'); break;
      case 'export': router.push('/export'); break;
    }
  };

  const generateVCards = () => {
    const selectedContactData = contacts.filter(c => selectedContacts.includes(c.id));
    
    selectedContactData.forEach(contact => {
      let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.role}
EMAIL:${contact.email || ''}
TEL:${contact.phone || ''}
URL:${contact.linkedinUrl || ''}`;

      if (includeNotes && contact.notes.length > 0) {
        const notesText = contact.notes.map(note => note.content).join('; ');
        vcard += `\nNOTE:${notesText}`;
      }

      vcard += '\nEND:VCARD';
      
      // For React Native, we'll show an alert with the vCard content
      Alert.alert(
        'vCard Generated',
        `vCard for ${contact.name}:\n\n${vcard}`,
        [{ text: 'OK' }]
      );
    });
  };

  const generateBulkVCard = () => {
    const selectedContactData = contacts.filter(c => selectedContacts.includes(c.id));
    
    let bulkVCard = '';
    selectedContactData.forEach(contact => {
      bulkVCard += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.role}
EMAIL:${contact.email || ''}
TEL:${contact.phone || ''}
URL:${contact.linkedinUrl || ''}`;

      if (includeNotes && contact.notes.length > 0) {
        const notesText = contact.notes.map(note => note.content).join('; ');
        bulkVCard += `\nNOTE:${notesText}`;
      }

      bulkVCard += '\nEND:VCARD\n';
    });

    Alert.alert(
      'Bulk vCard Generated',
      `Bulk vCard for ${selectedContactData.length} contacts:\n\n${bulkVCard}`,
      [{ text: 'OK' }]
    );
  };

  const generateQRCodes = () => {
    Alert.alert(
      'QR Codes',
      `QR codes would be generated for ${selectedContacts.length} contacts`,
      [{ text: 'OK' }]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.id));
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const allSelected = selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0;

  // Show loading state
  if (loading) {
    return (
      <DesktopLayout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        title="Export & Sync"
        subtitle="Export your contacts and manage synchronization"
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </DesktopLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DesktopLayout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        title="Export & Sync"
        subtitle="Export your contacts and manage synchronization"
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      title="Export & Sync"
      subtitle="Export your contacts and manage synchronization"
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.mainContainer}>
          {/* Export Options Sidebar */}
          <View style={styles.sidebar}>
            {/* Export Settings */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Export Settings</Text>
              <View style={styles.settingsContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Include Notes</Text>
                  <Switch
                    value={includeNotes}
                    onValueChange={setIncludeNotes}
                    trackColor={{ false: MementoColors.border.medium, true: MementoColors.primary }}
                    thumbColor={includeNotes ? MementoColors.text.white : MementoColors.text.muted}
                  />
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Include History</Text>
                  <Switch
                    value={includeHistory}
                    onValueChange={setIncludeHistory}
                    trackColor={{ false: MementoColors.border.medium, true: MementoColors.primary }}
                    thumbColor={includeHistory ? MementoColors.text.white : MementoColors.text.muted}
                  />
                </View>
                
                <View style={styles.separator} />
                
                <View style={styles.exportActions}>
                  <Text style={styles.actionsTitle}>Export Actions</Text>
                  <TouchableOpacity 
                    style={[styles.actionButton, selectedContacts.length === 0 && styles.actionButtonDisabled]}
                    onPress={generateVCards}
                    disabled={selectedContacts.length === 0}
                  >
                    <IconSymbol name="square.and.arrow.down" size={16} color={MementoColors.text.white} />
                    <Text style={styles.actionButtonText}>
                      Export Individual vCards ({selectedContacts.length})
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonSecondary, selectedContacts.length === 0 && styles.actionButtonDisabled]}
                    onPress={generateBulkVCard}
                    disabled={selectedContacts.length === 0}
                  >
                    <IconSymbol name="doc.text" size={16} color={MementoColors.text.primary} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Export Bulk vCard
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonSecondary, selectedContacts.length === 0 && styles.actionButtonDisabled]}
                    onPress={generateQRCodes}
                    disabled={selectedContacts.length === 0}
                  >
                    <IconSymbol name="qrcode" size={16} color={MementoColors.text.primary} />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                      Generate QR Codes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sync Options */}
            <View style={styles.settingsCard}>
              <Text style={styles.cardTitle}>Synchronization</Text>
              <View style={styles.settingsContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <IconSymbol name="cloud" size={16} color={MementoColors.text.secondary} />
                    <Text style={styles.settingLabel}>Cloud Sync</Text>
                  </View>
                  <Switch
                    value={cloudSync}
                    onValueChange={setCloudSync}
                    trackColor={{ false: MementoColors.border.medium, true: MementoColors.primary }}
                    thumbColor={cloudSync ? MementoColors.text.white : MementoColors.text.muted}
                  />
                </View>
                
                <View style={styles.syncStatus}>
                  {cloudSync ? (
                    <View style={styles.syncStatusRow}>
                      <IconSymbol name="cloud" size={12} color={MementoColors.success} />
                      <Text style={styles.syncStatusText}>Syncing to cloud storage</Text>
                    </View>
                  ) : (
                    <View style={styles.syncStatusRow}>
                      <IconSymbol name="externaldrive" size={12} color={MementoColors.text.muted} />
                      <Text style={styles.syncStatusText}>Local storage only</Text>
                    </View>
                  )}
                </View>

                <View style={styles.separator} />

                <View style={styles.syncStats}>
                  <Text style={styles.statsTitle}>Sync Statistics</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Contacts:</Text>
                    <Text style={styles.statValue}>{contacts.length}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Last Sync:</Text>
                    <Text style={styles.statValue}>Never</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Storage Used:</Text>
                    <Text style={styles.statValue}>Local only</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Selection */}
          <View style={styles.contactsSection}>
            {/* Selection Header */}
            <View style={styles.selectionHeader}>
              <View style={styles.selectionLeft}>
                <TouchableOpacity style={styles.selectAllButton} onPress={handleSelectAll}>
                  <IconSymbol 
                    name={allSelected ? "checkmark.square.fill" : "square"} 
                    size={16} 
                    color={MementoColors.text.primary} 
                  />
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
                <Text style={styles.selectionCount}>
                  {selectedContacts.length} of {contacts.length} contacts selected
                </Text>
              </View>

              {someSelected && (
                <View style={styles.selectedIndicator}>
                  <IconSymbol name="person.2" size={16} color={MementoColors.primary} />
                  <Text style={styles.selectedCount}>{selectedContacts.length} selected</Text>
                </View>
              )}
            </View>

            {/* Contact Grid */}
            {contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="person.2" size={48} color={MementoColors.text.muted} />
                <Text style={styles.emptyStateTitle}>No contacts to export</Text>
                <Text style={styles.emptyStateText}>
                  Add some contacts to get started with exporting
                </Text>
              </View>
            ) : (
              <View style={styles.contactsGrid}>
                {contacts.map((contact) => (
                  <View key={contact.id} style={styles.contactWrapper}>
                    <TouchableOpacity 
                      style={styles.contactCheckbox}
                      onPress={() => handleContactToggle(contact.id)}
                    >
                      <IconSymbol 
                        name={selectedContacts.includes(contact.id) ? "checkmark.square.fill" : "square"} 
                        size={16} 
                        color={selectedContacts.includes(contact.id) ? MementoColors.primary : MementoColors.text.muted} 
                      />
                    </TouchableOpacity>
                    <View style={[
                      styles.contactCard,
                      selectedContacts.includes(contact.id) && styles.contactCardSelected
                    ]}>
                      <ContactCard
                        contact={contact}
                        onPress={() => handleContactToggle(contact.id)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </DesktopLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  mainContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: MementoSpacing.lg,
  },
  sidebar: {
    width: 300,
    gap: MementoSpacing.lg,
  },
  settingsCard: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border,
    ...MementoShadows.sm,
  },
  cardTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    padding: MementoSpacing.lg,
    paddingBottom: MementoSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border,
  },
  settingsContent: {
    padding: MementoSpacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
  settingLabel: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: MementoColors.border.light,
    marginVertical: MementoSpacing.md,
  },
  exportActions: {
    gap: MementoSpacing.sm,
  },
  actionsTitle: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MementoColors.primary,
    paddingVertical: MementoSpacing.sm,
    paddingHorizontal: MementoSpacing.md,
    borderRadius: MementoBorderRadius.md,
    gap: MementoSpacing.sm,
  },
  actionButtonSecondary: {
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '500',
    color: MementoColors.text.white,
  },
  actionButtonTextSecondary: {
    color: MementoColors.text.primary,
  },
  syncStatus: {
    marginTop: MementoSpacing.sm,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.xs,
  },
  syncStatusText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.secondary,
  },
  syncStats: {
    gap: MementoSpacing.xs,
  },
  statsTitle: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
  },
  statValue: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  contactsSection: {
    flex: 1,
    gap: MementoSpacing.md,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundCard,
    padding: MementoSpacing.md,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    ...MementoShadows.sm,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.md,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    paddingHorizontal: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  selectAllText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  selectionCount: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.xs,
    paddingVertical: MementoSpacing.xs,
    paddingHorizontal: MementoSpacing.sm,
    backgroundColor: MementoColors.primary + '20',
    borderRadius: MementoBorderRadius.sm,
  },
  selectedCount: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    ...MementoShadows.sm,
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
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.md,
  },
  contactWrapper: {
    width: '48%',
    position: 'relative',
  },
  contactCheckbox: {
    position: 'absolute',
    top: MementoSpacing.sm,
    left: MementoSpacing.sm,
    zIndex: 1,
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.sm,
    padding: MementoSpacing.xs,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    ...MementoShadows.sm,
  },
  contactCard: {
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    overflow: 'hidden',
  },
  contactCardSelected: {
    borderColor: MementoColors.primary,
    borderWidth: 2,
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
    color: MementoColors.error, // Fixed: use top-level error color
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
});
