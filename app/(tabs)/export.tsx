import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExportScreen() {
  const { contacts, loading, error } = useFirebaseContacts();
  const [selectedFormat, setSelectedFormat] = useState<'vcard' | 'csv' | 'json'>('vcard');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: 'vcard' as const,
      name: 'vCard (.vcf)',
      description: 'Standard contact format for most applications',
      icon: 'person.circle',
      color: MementoColors.primary
    },
    {
      id: 'csv' as const,
      name: 'CSV (.csv)',
      description: 'Spreadsheet format for data analysis',
      icon: 'tablecells',
      color: MementoColors.info
    },
    {
      id: 'json' as const,
      name: 'JSON (.json)',
      description: 'Developer-friendly format with full data',
      icon: 'curlybraces',
      color: MementoColors.warning
    }
  ];

  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      const contactsToExport = selectedContacts.length > 0 
        ? contacts.filter(contact => selectedContacts.includes(contact.id))
        : contacts;
      
      let exportData = '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (selectedFormat) {
        case 'vcard':
          exportData = generateVCard(contactsToExport);
          break;
        case 'csv':
          exportData = generateCSV(contactsToExport);
          break;
        case 'json':
          exportData = JSON.stringify(contactsToExport, null, 2);
          break;
      }
      
      // In a real app, this would save and share the file
      Alert.alert(
        'Export Complete',
        `Exported ${contactsToExport.length} contacts in ${selectedFormat.toUpperCase()} format.\n\nFile: memento-contacts-${timestamp}.${selectedFormat === 'vcard' ? 'vcf' : selectedFormat}`,
        [{ text: 'OK' }]
      );
      
      setIsExporting(false);
    }, 2000);
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.id));
    }
  };

  const generateVCard = (contacts: any[]) => {
    return contacts.map(contact => {
      let vcard = 'BEGIN:VCARD\n';
      vcard += 'VERSION:3.0\n';
      vcard += `FN:${contact.name}\n`;
      vcard += `ORG:${contact.company}\n`;
      vcard += `TITLE:${contact.role}\n`;
      if (contact.email) vcard += `EMAIL:${contact.email}\n`;
      if (contact.phone) vcard += `TEL:${contact.phone}\n`;
      if (contact.linkedinUrl) vcard += `URL:${contact.linkedinUrl}\n`;
      vcard += 'END:VCARD\n';
      return vcard;
    }).join('\n');
  };

  const generateCSV = (contacts: any[]) => {
    const headers = ['Name', 'Company', 'Role', 'Email', 'Phone', 'LinkedIn', 'Tags'];
    const rows = contacts.map(contact => [
      contact.name,
      contact.company,
      contact.role,
      contact.email || '',
      contact.phone || '',
      contact.linkedinUrl || '',
      contact.tags.join('; ')
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
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

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Export Contacts</Text>
          <Text style={styles.pageSubtitle}>Choose format and select contacts to export</Text>
        </View>

        {/* Export Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatContainer}>
            {exportFormats.map((format) => (
              <TouchableOpacity
                key={format.id}
                style={[
                  styles.formatCard,
                  selectedFormat === format.id && styles.formatCardSelected
                ]}
                onPress={() => setSelectedFormat(format.id)}
              >
                <View style={[styles.formatIcon, { backgroundColor: format.color + '20' }]}>
                  <IconSymbol name={format.icon} size={24} color={format.color} />
                </View>
                <View style={styles.formatInfo}>
                  <Text style={styles.formatName}>{format.name}</Text>
                  <Text style={styles.formatDescription}>{format.description}</Text>
                </View>
                <View style={styles.formatRadio}>
                  {selectedFormat === format.id && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={format.color} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Contacts</Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.selectAllText}>Select All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            {selectedContacts.length} of {contacts.length} contacts selected
          </Text>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          <View style={styles.optionsContainer}>
            <View style={styles.option}>
              <IconSymbol name="checkmark.circle" size={20} color={MementoColors.success} />
              <Text style={styles.optionText}>Include contact photos</Text>
            </View>
            <View style={styles.option}>
              <IconSymbol name="checkmark.circle" size={20} color={MementoColors.success} />
              <Text style={styles.optionText}>Include notes and tags</Text>
            </View>
            <View style={styles.option}>
              <IconSymbol name="checkmark.circle" size={20} color={MementoColors.success} />
              <Text style={styles.optionText}>Include encounter history</Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.exportContainer}>
          <TouchableOpacity 
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]} 
            onPress={handleExport}
            disabled={isExporting}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color="white" />
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Exporting...' : 'Export Contacts'}
            </Text>
          </TouchableOpacity>
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
  section: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    marginBottom: MementoSpacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.sm,
  },
  sectionSubtitle: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
  },
  formatContainer: {
    gap: MementoSpacing.sm,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 2,
    borderColor: MementoColors.border.light,
  },
  formatCardSelected: {
    borderColor: MementoColors.primary,
    backgroundColor: MementoColors.primary + '10',
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: MementoBorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  formatDescription: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
  },
  formatRadio: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: MementoSpacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
  },
  optionText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
  },
  exportContainer: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MementoColors.primary,
    paddingVertical: MementoSpacing.md,
    paddingHorizontal: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.lg,
    gap: MementoSpacing.sm,
  },
  exportButtonText: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.white,
  },
  exportButtonDisabled: {
    backgroundColor: MementoColors.text.muted,
    opacity: 0.6,
  },
});
