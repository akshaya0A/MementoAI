import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { Contact } from '@/types/contact';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ContactCardProps {
  contact: Contact;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showRecentEncounter?: boolean;
  showEncounterCount?: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onPress, 
  onEdit,
  onDelete,
  showRecentEncounter = false,
  showEncounterCount = false 
}) => {
  const latestEncounter = contact.encounters[contact.encounters.length - 1];
  const isRecentlyMet = latestEncounter && 
    new Date(latestEncounter.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000; // Within last 7 days
  
  const latestNote = contact.notes[contact.notes.length - 1];

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('mit')) return MementoColors.tags.mit;
    if (tagLower.includes('ai')) return MementoColors.tags.ai;
    if (tagLower.includes('product')) return MementoColors.tags.product;
    if (tagLower.includes('mobile')) return MementoColors.tags.mobile;
    if (tagLower.includes('engineering')) return MementoColors.tags.engineering;
    if (tagLower.includes('react')) return MementoColors.tags.react;
    if (tagLower.includes('hr')) return MementoColors.tags.hr;
    if (tagLower.includes('data')) return MementoColors.tags.dataScience;
    if (tagLower.includes('design')) return MementoColors.tags.design;
    if (tagLower.includes('ux')) return MementoColors.tags.ux;
    return MementoColors.primary;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Status Badges */}
      {isRecentlyMet && showRecentEncounter && (
        <View style={styles.recentBadge}>
          <IconSymbol name="flame" size={12} color={MementoColors.warning} />
          <Text style={styles.badgeText}>Seen Recently</Text>
        </View>
      )}
      
      {showEncounterCount && contact.encounters.length > 1 && (
        <View style={styles.encounterBadge}>
          <Text style={styles.badgeText}>{contact.encounters.length} encounters</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{getInitials(contact.name)}</Text>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.role}>{contact.role} at {contact.company}</Text>
          </View>
        </View>
        
        {/* Encounter Info */}
        {latestEncounter && (
          <View style={styles.encounterInfo}>
            <View style={styles.encounterRow}>
              <IconSymbol name="calendar" size={12} color={MementoColors.text.muted} />
              <Text style={styles.encounterText}>
                {latestEncounter.date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.encounterRow}>
              <IconSymbol name="location" size={12} color={MementoColors.text.muted} />
              <Text style={styles.encounterText}>{latestEncounter.event}</Text>
            </View>
          </View>
        )}
        
        {/* Where Met Info */}
        <View style={styles.whereMetInfo}>
          <Text style={styles.whereMetText}>
            Met at: {contact.whereMet} • From: {contact.whereFrom}
          </Text>
        </View>
        
        {/* Latest Note */}
        {latestNote && (
          <Text style={styles.notes} numberOfLines={2}>
            {latestNote.content}
          </Text>
        )}
        
        {/* Social Media Indicators */}
        {contact.socialMedia && contact.socialMedia.length > 0 && (
          <View style={styles.socialMediaIndicators}>
            {contact.socialMedia.slice(0, 3).map((social, index) => (
              <View key={index} style={styles.socialMediaIndicator}>
                <IconSymbol 
                  name={getSocialMediaIcon(social.platform)} 
                  size={12} 
                  color={MementoColors.primary} 
                />
              </View>
            ))}
            {contact.socialMedia.length > 3 && (
              <View style={styles.socialMediaIndicator}>
                <Text style={styles.socialMediaCount}>+{contact.socialMedia.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        {contact.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {contact.tags.slice(0, 2).map((tag, index) => (
              <View 
                key={index} 
                style={[styles.tag, { backgroundColor: getTagColor(tag) }]}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {contact.tags.length > 2 && (
              <View style={[styles.tag, { backgroundColor: MementoColors.border.medium }]}>
                <Text style={styles.tagText}>+{contact.tags.length - 2}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <View style={styles.actionButtons}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <IconSymbol name="pencil" size={16} color={MementoColors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <IconSymbol name="trash" size={16} color={MementoColors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    marginBottom: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    width: '48%',
    padding: MementoSpacing.md,
  },
  recentBadge: {
    position: 'absolute',
    top: MementoSpacing.sm,
    right: MementoSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.warning + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.full,
    zIndex: 1,
  },
  encounterBadge: {
    position: 'absolute',
    top: MementoSpacing.sm,
    right: MementoSpacing.sm,
    backgroundColor: MementoColors.info + '20',
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.full,
    zIndex: 1,
  },
  badgeText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.primary,
    fontWeight: '600',
    marginLeft: MementoSpacing.xs,
  },
  content: {
    padding: MementoSpacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: MementoBorderRadius.full,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  avatar: {
    fontSize: MementoFontSizes.sm,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  role: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    fontWeight: '400',
  },
  encounterInfo: {
    marginBottom: MementoSpacing.sm,
  },
  encounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  encounterText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    marginLeft: MementoSpacing.xs,
  },
  whereMetInfo: {
    marginBottom: MementoSpacing.sm,
  },
  whereMetText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
  },
  notes: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    lineHeight: 20,
    marginBottom: MementoSpacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
    marginRight: MementoSpacing.xs,
    marginBottom: MementoSpacing.xs,
  },
  tagText: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '600',
    color: MementoColors.text.white,
  },
  socialMediaIndicators: {
    flexDirection: 'row',
    marginBottom: MementoSpacing.sm,
    gap: MementoSpacing.xs,
  },
  socialMediaIndicator: {
    width: 24,
    height: 24,
    borderRadius: MementoBorderRadius.sm,
    backgroundColor: MementoColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialMediaCount: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '600',
    color: MementoColors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: MementoSpacing.sm,
    gap: MementoSpacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: MementoBorderRadius.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
});
