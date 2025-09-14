import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Linking, Alert } from 'react-native';
import { Contact } from '@/types/contact';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { IconSymbol } from './ui/icon-symbol';
import { ContactForm } from './ContactForm';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactDetail({ contact, onEdit, onDelete }: ContactDetailProps) {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'history'>('overview');

  const generateVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.role}
EMAIL:${contact.email || ''}
TEL:${contact.phone || ''}
URL:${contact.linkedinUrl || ''}
END:VCARD`;
    
    // For React Native, we'll show an alert with the vCard content
    Alert.alert(
      'vCard Generated',
      'vCard content copied to clipboard:\n\n' + vcard,
      [{ text: 'OK' }]
    );
  };

  const handleCall = () => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleLinkedIn = () => {
    if (contact.linkedinUrl) {
      Linking.openURL(contact.linkedinUrl);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const generateTags = () => {
    const tags = [];
    if (contact.company.includes('Tech')) tags.push('Engineering');
    if (contact.role.includes('Engineer')) tags.push('React');
    if (contact.role.includes('Product')) tags.push('Product');
    if (contact.role.includes('Design')) tags.push('Design');
    if (contact.role.includes('Talent')) tags.push('HR');
    return tags;
  };

  const tags = generateTags();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => {}}>
            <IconSymbol name="chevron.down" size={20} color={MementoColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Details</Text>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <IconSymbol name="gearshape" size={20} color={MementoColors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.profileContent}>
          <View style={styles.profileMain}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{contact.name}</Text>
              <Text style={styles.role}>{contact.role} at {contact.company}</Text>
              
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                {contact.phone && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                    <IconSymbol name="phone" size={16} color={MementoColors.primary} />
                    <Text style={styles.actionButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
                {contact.email && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                    <IconSymbol name="mail" size={16} color={MementoColors.primary} />
                    <Text style={styles.actionButtonText}>Email</Text>
                  </TouchableOpacity>
                )}
                {contact.linkedinUrl && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleLinkedIn}>
                    <IconSymbol name="linkedin" size={16} color={MementoColors.primary} />
                    <Text style={styles.actionButtonText}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
          {/* Export Actions */}
          <View style={styles.exportActions}>
            <TouchableOpacity style={styles.exportButton} onPress={generateVCard}>
              <IconSymbol name="square.and.arrow.down" size={16} color={MementoColors.text.secondary} />
              <Text style={styles.exportButtonText}>Export vCard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton}>
              <IconSymbol name="qrcode" size={16} color={MementoColors.text.secondary} />
              <Text style={styles.exportButtonText}>QR Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]} 
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notes' && styles.activeTab]} 
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>
            Notes ({contact.notes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History ({contact.encounters.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Tags & Labels */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tags & Labels</Text>
            <View style={styles.tagsContainer}>
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: MementoColors.tags.engineering + '20' }]}>
                    <Text style={[styles.tagText, { color: MementoColors.tags.engineering }]}>{tag}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No tags assigned</Text>
              )}
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{contact.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{contact.role}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>{contact.company}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Where From</Text>
                <Text style={styles.infoValue}>{contact.whereFrom}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Where We Met</Text>
                <Text style={styles.infoValue}>{contact.whereMet}</Text>
              </View>
              {contact.email && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{contact.email}</Text>
                </View>
              )}
              {contact.phone && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{contact.phone}</Text>
                </View>
              )}
              {contact.linkedinUrl && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>LinkedIn</Text>
                  <TouchableOpacity onPress={handleLinkedIn}>
                    <Text style={styles.linkText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Fun Facts */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Fun Facts</Text>
            {contact.funFacts.length > 0 ? (
              <View style={styles.funFactsList}>
                {contact.funFacts.map((fact, index) => (
                  <View key={index} style={styles.funFactItem}>
                    <View style={styles.funFactDot} />
                    <Text style={styles.funFactText}>{fact}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No fun facts recorded</Text>
            )}
          </View>
        </View>
      )}

      {activeTab === 'notes' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {contact.notes.length > 0 ? (
              <View style={styles.notesList}>
                {contact.notes.map((note, index) => (
                  <View key={note.id} style={styles.noteItem}>
                    <View style={styles.noteIcon}>
                      <IconSymbol 
                        name={note.isVoiceNote ? "mic" : "message"} 
                        size={16} 
                        color={note.isVoiceNote ? MementoColors.primary : MementoColors.text.muted} 
                      />
                    </View>
                    <View style={styles.noteContent}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteDate}>
                          {formatDate(note.timestamp)}
                        </Text>
                        {note.isVoiceNote && (
                          <View style={styles.voiceBadge}>
                            <Text style={styles.voiceBadgeText}>Voice Note</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.noteText}>{note.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No notes recorded</Text>
            )}
          </View>
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Encounter History</Text>
            {contact.encounters.length > 0 ? (
              <View style={styles.encountersList}>
                {contact.encounters.map((encounter, index) => (
                  <View key={encounter.id} style={styles.encounterItem}>
                    <View style={styles.encounterIcon}>
                      <IconSymbol name="clock" size={16} color={MementoColors.success} />
                    </View>
                    <View style={styles.encounterContent}>
                      <View style={styles.encounterHeader}>
                        <View style={styles.encounterDate}>
                          <IconSymbol name="calendar.badge.clock" size={12} color={MementoColors.text.muted} />
                          <Text style={styles.encounterDateText}>
                            {formatDate(encounter.date)}
                          </Text>
                        </View>
                        <View style={styles.encounterLocation}>
                          <IconSymbol name="safari" size={12} color={MementoColors.text.muted} />
                          <Text style={styles.encounterLocationText}>{encounter.location}</Text>
                        </View>
                      </View>
                      <Text style={styles.encounterEvent}>{encounter.event}</Text>
                      {encounter.notes && (
                        <Text style={styles.encounterNotes}>{encounter.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No encounters recorded</Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => setIsEditFormOpen(true)}
        >
          <IconSymbol name="pencil" size={16} color={MementoColors.text.white} />
          <Text style={styles.editButtonText}>Edit Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => {
            Alert.alert(
              'Delete Contact',
              `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => onDelete(contact.id)
                }
              ]
            );
          }}
        >
          <IconSymbol name="trash" size={16} color={MementoColors.text.white} />
          <Text style={styles.deleteButtonText}>Delete Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Contact Form */}
      {isEditFormOpen && (
        <ContactForm
          contact={contact}
          onSave={(updatedContact) => {
            onEdit(updatedContact);
            setIsEditFormOpen(false);
          }}
          onCancel={() => setIsEditFormOpen(false)}
        />
      )}
    </ScrollView>
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
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: MementoSpacing.sm,
    marginRight: MementoSpacing.sm,
  },
  headerTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '600',
    color: MementoColors.text.primary,
  },
  moreButton: {
    padding: MementoSpacing.sm,
  },
  profileCard: {
    backgroundColor: MementoColors.backgroundCard,
    margin: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.lg,
    ...MementoShadows.sm,
  },
  profileContent: {
    padding: MementoSpacing.lg,
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: MementoSpacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.lg,
  },
  avatarText: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  role: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    backgroundColor: MementoColors.background,
  },
  actionButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    marginLeft: 4,
  },
  exportActions: {
    flexDirection: 'row',
    gap: MementoSpacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    backgroundColor: MementoColors.background,
  },
  exportButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: MementoColors.background,
    marginHorizontal: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: MementoSpacing.sm,
    paddingHorizontal: MementoSpacing.md,
    borderRadius: MementoBorderRadius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: MementoColors.primary,
  },
  tabText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: MementoColors.text.white,
    fontWeight: '600',
  },
  tabContent: {
    padding: MementoSpacing.lg,
  },
  sectionCard: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.lg,
    marginBottom: MementoSpacing.lg,
    ...MementoShadows.sm,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.sm,
  },
  tag: {
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: 4,
    borderRadius: MementoBorderRadius.sm,
  },
  tagText: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '500',
  },
  infoList: {
    gap: MementoSpacing.md,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
  },
  infoValue: {
    fontSize: MementoFontSizes.md,
    fontWeight: '500',
    color: MementoColors.text.primary,
  },
  linkText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.primary,
    textDecorationLine: 'underline',
  },
  funFactsList: {
    gap: MementoSpacing.sm,
  },
  funFactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: MementoSpacing.sm,
  },
  funFactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MementoColors.primary,
    marginTop: 6,
  },
  funFactText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    flex: 1,
  },
  emptyText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
    fontStyle: 'italic',
  },
  notesList: {
    gap: MementoSpacing.lg,
  },
  noteItem: {
    flexDirection: 'row',
    gap: MementoSpacing.md,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MementoColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
    marginBottom: 4,
  },
  noteDate: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
  },
  voiceBadge: {
    backgroundColor: MementoColors.primary + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 2,
    borderRadius: MementoBorderRadius.sm,
  },
  voiceBadgeText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.primary,
    fontWeight: '500',
  },
  noteText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
  },
  encountersList: {
    gap: MementoSpacing.lg,
  },
  encounterItem: {
    flexDirection: 'row',
    gap: MementoSpacing.md,
  },
  encounterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MementoColors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  encounterContent: {
    flex: 1,
  },
  encounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.md,
    marginBottom: 4,
  },
  encounterDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encounterDateText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
  },
  encounterLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encounterLocationText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
  },
  encounterEvent: {
    fontSize: MementoFontSizes.md,
    fontWeight: '500',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  encounterNotes: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: MementoSpacing.md,
    padding: MementoSpacing.lg,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MementoSpacing.md,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    gap: MementoSpacing.sm,
  },
  editButtonText: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.white,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: MementoSpacing.md,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.error,
    gap: MementoSpacing.sm,
  },
  deleteButtonText: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.white,
  },
});
