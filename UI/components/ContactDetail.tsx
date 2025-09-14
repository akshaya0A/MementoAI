import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { Contact } from '@/types/contact';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: string) => void;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({ 
  contact, 
  onBack, 
  onEdit, 
  onDelete 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  const handleSocialMedia = (url: string) => {
    Linking.openURL(url);
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return 'link';
      case 'github':
        return 'code';
      case 'twitter':
        return 'bird';
      case 'instagram':
        return 'camera';
      case 'website':
        return 'globe';
      default:
        return 'link';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color={MementoColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.headerActions}>
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onEdit(contact)}
            >
              <IconSymbol name="pencil" size={20} color={MementoColors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onDelete(contact.id)}
            >
              <IconSymbol name="trash" size={20} color={MementoColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Info Card */}
        <View style={styles.contactCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{getInitials(contact.name)}</Text>
          </View>
          
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.role}>{contact.role} at {contact.company}</Text>
          
          {/* Contact Actions */}
          <View style={styles.contactActions}>
            {contact.phone && (
              <TouchableOpacity style={styles.contactAction} onPress={handleCall}>
                <IconSymbol name="phone" size={20} color={MementoColors.primary} />
                <Text style={styles.contactActionText}>Call</Text>
              </TouchableOpacity>
            )}
            {contact.email && (
              <TouchableOpacity style={styles.contactAction} onPress={handleEmail}>
                <IconSymbol name="envelope" size={20} color={MementoColors.primary} />
                <Text style={styles.contactActionText}>Email</Text>
              </TouchableOpacity>
            )}
            {contact.linkedinUrl && (
              <TouchableOpacity style={styles.contactAction} onPress={handleLinkedIn}>
                <IconSymbol name="link" size={20} color={MementoColors.primary} />
                <Text style={styles.contactActionText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoRow}>
            <IconSymbol name="building.2" size={16} color={MementoColors.text.muted} />
            <Text style={styles.infoLabel}>Company:</Text>
            <Text style={styles.infoValue}>{contact.company}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="location" size={16} color={MementoColors.text.muted} />
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{contact.whereFrom}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="hand.raised" size={16} color={MementoColors.text.muted} />
            <Text style={styles.infoLabel}>Met at:</Text>
            <Text style={styles.infoValue}>{contact.whereMet}</Text>
          </View>
        </View>

        {/* Social Media */}
        {contact.socialMedia && contact.socialMedia.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media & Links</Text>
            {contact.socialMedia.map((social, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialMediaItem}
                onPress={() => handleSocialMedia(social.url)}
              >
                <View style={styles.socialMediaIcon}>
                  <IconSymbol 
                    name={getSocialMediaIcon(social.platform)} 
                    size={20} 
                    color={MementoColors.primary} 
                  />
                </View>
                <View style={styles.socialMediaInfo}>
                  <Text style={styles.socialMediaPlatform}>{social.platform}</Text>
                  {social.username && (
                    <Text style={styles.socialMediaUsername}>@{social.username}</Text>
                  )}
                </View>
                <IconSymbol name="arrow.up.right" size={16} color={MementoColors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Fun Facts */}
        {contact.funFacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fun Facts</Text>
            {contact.funFacts.map((fact, index) => (
              <View key={index} style={styles.funFactItem}>
                <IconSymbol name="star" size={16} color={MementoColors.warning} />
                <Text style={styles.funFactText}>{fact}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {contact.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {contact.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {contact.notes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {contact.notes.map((note) => (
              <View key={note.id} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <IconSymbol 
                    name={note.isVoiceNote ? "mic" : "note.text"} 
                    size={16} 
                    color={MementoColors.text.muted} 
                  />
                  <Text style={styles.noteDate}>
                    {note.timestamp.toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Encounters */}
        {contact.encounters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encounters ({contact.encounters.length})</Text>
            {contact.encounters
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((encounter) => (
                <View key={encounter.id} style={styles.encounterItem}>
                  <View style={styles.encounterHeader}>
                    <IconSymbol name="calendar" size={16} color={MementoColors.primary} />
                    <Text style={styles.encounterDate}>
                      {encounter.date.toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.encounterEvent}>{encounter.event}</Text>
                  <Text style={styles.encounterLocation}>{encounter.location}</Text>
                  {encounter.notes && (
                    <Text style={styles.encounterNotes}>{encounter.notes}</Text>
                  )}
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  backButton: {
    padding: MementoSpacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    textAlign: 'center',
    marginHorizontal: MementoSpacing.md,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: MementoSpacing.sm,
    marginLeft: MementoSpacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: MementoColors.backgroundCard,
    margin: MementoSpacing.md,
    padding: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: MementoBorderRadius.full,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: MementoSpacing.md,
  },
  avatar: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  name: {
    fontSize: MementoFontSizes.xxl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
    textAlign: 'center',
  },
  role: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.lg,
    textAlign: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    gap: MementoSpacing.md,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  contactActionText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.primary,
    marginLeft: MementoSpacing.xs,
    fontWeight: '600',
  },
  section: {
    backgroundColor: MementoColors.backgroundCard,
    margin: MementoSpacing.md,
    padding: MementoSpacing.lg,
    borderRadius: MementoBorderRadius.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  infoLabel: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.sm,
    marginRight: MementoSpacing.sm,
    minWidth: 60,
  },
  infoValue: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    flex: 1,
  },
  funFactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  funFactText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.xs,
  },
  tag: {
    backgroundColor: MementoColors.primary + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
  },
  tagText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.primary,
    fontWeight: '600',
  },
  noteItem: {
    marginBottom: MementoSpacing.md,
    paddingBottom: MementoSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  noteDate: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.xs,
  },
  noteContent: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    lineHeight: 20,
  },
  encounterItem: {
    marginBottom: MementoSpacing.md,
    paddingBottom: MementoSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  encounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  encounterDate: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.xs,
  },
  encounterEvent: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  encounterLocation: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.xs,
  },
  encounterNotes: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontStyle: 'italic',
  },
  socialMediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
    paddingHorizontal: MementoSpacing.md,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    marginBottom: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  socialMediaIcon: {
    width: 40,
    height: 40,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  socialMediaInfo: {
    flex: 1,
  },
  socialMediaPlatform: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  socialMediaUsername: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.secondary,
  },
});
