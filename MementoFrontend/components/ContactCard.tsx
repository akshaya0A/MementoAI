import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Contact } from '@/types/contact';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { IconSymbol } from './ui/icon-symbol';
import { SocialIcon } from './ui/social-icon';

interface ContactCardProps {
  contact: Contact;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetail?: (contact: Contact) => void;
  showEncounterCount?: boolean;
  showRecentEncounter?: boolean;
}

export function ContactCard({ 
  contact, 
  onPress, 
  onEdit, 
  onDelete, 
  onViewDetail,
  showEncounterCount = false,
  showRecentEncounter = false 
}: ContactCardProps) {
  const latestEncounter = contact.encounters.length > 0 
    ? contact.encounters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const latestNote = contact.notes.length > 0 
    ? contact.notes[contact.notes.length - 1]
    : null;

  const isRecentlyMet = latestEncounter && 
    (typeof latestEncounter.date === 'string' ? new Date(latestEncounter.date) : latestEncounter.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000; // Within last 7 days

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Generate tags based on contact data
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

  const handlePress = () => {
    if (onViewDetail) {
      onViewDetail(contact);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      {/* Status Badges */}
      {isRecentlyMet && showRecentEncounter && (
        <View style={styles.recentBadge}>
          <IconSymbol name="clock" size={12} color={MementoColors.warning} />
          <Text style={styles.badgeText}>Seen Recently</Text>
        </View>
      )}
      
      {showEncounterCount && contact.encounters.length > 1 && (
        <View style={styles.encounterBadge}>
          <Text style={styles.badgeText}>{contact.encounters.length} encounters</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
          </View>
          
          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
            <Text style={styles.companyRole} numberOfLines={1}>
              {contact.role} at {contact.company}
            </Text>
            
            {/* Encounter Details */}
            {latestEncounter && (
              <View style={styles.encounterDetails}>
                <View style={styles.encounterRow}>
                  <IconSymbol name="calendar.badge.clock" size={12} color={MementoColors.text.muted} />
                  <Text style={styles.encounterText}>
                    {formatDate(latestEncounter.date)}
                  </Text>
                </View>
                <View style={styles.encounterRow}>
                  <IconSymbol name="safari" size={12} color={MementoColors.text.muted} />
                  <Text style={styles.encounterText} numberOfLines={1}>
                    {latestEncounter.location || latestEncounter.notes}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Where Met Info */}
            <Text style={styles.whereMetText} numberOfLines={1}>
              Met at: {contact.whereMet} • From: {contact.whereFrom}
            </Text>
            
            {/* Latest Note */}
            {latestNote && (
              <Text style={styles.noteText} numberOfLines={2}>
                {latestNote.content}
              </Text>
            )}
            
            {/* Social Media Links */}
            <View style={styles.socialLinksContainer}>
              {contact.linkedinUrl && (
                <TouchableOpacity style={styles.socialLink}>
                  <SocialIcon platform="linkedin" size={14} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              )}
              {contact.githubUrl && (
                <TouchableOpacity style={styles.socialLink}>
                  <SocialIcon platform="github" size={14} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              )}
              {contact.twitterUrl && (
                <TouchableOpacity style={styles.socialLink}>
                  <SocialIcon platform="x" size={14} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              )}
              {contact.instagramUrl && (
                <TouchableOpacity style={styles.socialLink}>
                  <SocialIcon platform="instagram" size={14} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              )}
              {contact.websiteUrl && (
                <TouchableOpacity style={styles.socialLink}>
                  <SocialIcon platform="globe" size={14} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.slice(0, 2).map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: MementoColors.backgroundSecondary, borderColor: MementoColors.borderMedium }]}>
                    <Text style={[styles.tagText, { color: MementoColors.text.primary }]}>{tag}</Text>
                  </View>
                ))}
                {tags.length > 2 && (
                  <View style={[styles.tag, { backgroundColor: MementoColors.backgroundSecondary, borderColor: MementoColors.borderMedium }]}>
                    <Text style={[styles.tagText, { color: MementoColors.text.muted }]}>+{tags.length - 2}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <IconSymbol name="pencil" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <IconSymbol name="trash" size={16} color={MementoColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.lg,
    marginBottom: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    ...MementoShadows.sm,
    minHeight: 160,
    position: 'relative',
  },
  recentBadge: {
    position: 'absolute',
    top: MementoSpacing.sm,
    right: MementoSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.warning + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 4,
    borderRadius: MementoBorderRadius.sm,
    zIndex: 1,
  },
  encounterBadge: {
    position: 'absolute',
    top: MementoSpacing.sm,
    right: MementoSpacing.sm,
    backgroundColor: MementoColors.primary + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 4,
    borderRadius: MementoBorderRadius.sm,
    zIndex: 1,
  },
  badgeText: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '600',
    color: MementoColors.warning,
    marginLeft: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
  },
  avatarText: {
    fontSize: MementoFontSizes.md,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 4,
  },
  companyRole: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.sm,
  },
  encounterDetails: {
    marginBottom: MementoSpacing.xs,
  },
  encounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  encounterText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    marginLeft: 4,
    flex: 1,
  },
  whereMetText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    marginBottom: MementoSpacing.xs,
  },
  noteText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    marginBottom: MementoSpacing.sm,
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.xs,
  },
  tag: {
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 2,
    borderRadius: MementoBorderRadius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '500',
  },
  socialLinksContainer: {
    flexDirection: 'row',
    gap: MementoSpacing.sm,
    marginBottom: MementoSpacing.sm,
  },
  socialLink: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: MementoSpacing.sm,
  },
  actionButton: {
    padding: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    marginLeft: MementoSpacing.xs,
  },
});
