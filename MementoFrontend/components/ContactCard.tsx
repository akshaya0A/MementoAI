import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Contact } from '@/types/contact';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ContactCardProps {
  contact: Contact;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showEncounterCount?: boolean;
  showRecentEncounter?: boolean;
}

export function ContactCard({ 
  contact, 
  onPress, 
  onEdit, 
  onDelete, 
  showEncounterCount = false,
  showRecentEncounter = false 
}: ContactCardProps) {
  const latestEncounter = contact.encounters.length > 0 
    ? contact.encounters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };


  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardActions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <IconSymbol name="pencil" size={14} color={MementoColors.text.secondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <IconSymbol name="trash" size={14} color={MementoColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
        <Text style={styles.company} numberOfLines={1}>{contact.company}</Text>
        <Text style={styles.role} numberOfLines={1}>{contact.role}</Text>
        
        {showEncounterCount && (
          <View style={styles.encounterInfo}>
            <IconSymbol name="handshake" size={12} color={MementoColors.text.secondary} />
            <Text style={styles.encounterText}>
              {contact.encounters.length} encounter{contact.encounters.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        
        {showRecentEncounter && latestEncounter && (
          <View style={styles.recentInfo}>
            <IconSymbol name="clock" size={12} color={MementoColors.text.secondary} />
            <Text style={styles.recentText}>
              Last seen {formatDate(latestEncounter.date)}
            </Text>
          </View>
        )}
        
        {contact.funFacts.length > 0 && (
          <View style={styles.funFacts}>
            <Text style={styles.funFactText} numberOfLines={2}>
              {contact.funFacts[0]}
            </Text>
          </View>
        )}
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {contact.company.includes('Tech') && (
            <View style={[styles.tag, { backgroundColor: MementoColors.tags.engineering + '20' }]}>
              <Text style={[styles.tagText, { color: MementoColors.tags.engineering }]}>Engineering</Text>
            </View>
          )}
          {contact.role.includes('Engineer') && (
            <View style={[styles.tag, { backgroundColor: MementoColors.tags.react + '20' }]}>
              <Text style={[styles.tagText, { color: MementoColors.tags.react }]}>React</Text>
            </View>
          )}
          {contact.role.includes('Product') && (
            <View style={[styles.tag, { backgroundColor: MementoColors.tags.product + '20' }]}>
              <Text style={[styles.tagText, { color: MementoColors.tags.product }]}>Product</Text>
            </View>
          )}
          {contact.role.includes('Design') && (
            <View style={[styles.tag, { backgroundColor: MementoColors.tags.design + '20' }]}>
              <Text style={[styles.tagText, { color: MementoColors.tags.design }]}>Design</Text>
            </View>
          )}
          {contact.role.includes('Talent') && (
            <View style={[styles.tag, { backgroundColor: MementoColors.tags.hr + '20' }]}>
              <Text style={[styles.tagText, { color: MementoColors.tags.hr }]}>HR</Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: MementoColors.text.muted + '20' }]}>
            <Text style={[styles.tagText, { color: MementoColors.text.muted }]}>+1</Text>
          </View>
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
    borderColor: MementoColors.border.light,
    ...MementoShadows.sm,
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: MementoSpacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: MementoFontSizes.sm,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  cardActions: {
    flexDirection: 'row',
    gap: MementoSpacing.xs,
  },
  actionButton: {
    padding: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  company: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: 2,
  },
  role: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
    marginBottom: MementoSpacing.xs,
  },
  encounterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  encounterText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.secondary,
    marginLeft: 4,
  },
  recentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.xs,
  },
  recentText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.secondary,
    marginLeft: 4,
  },
  funFacts: {
    marginTop: MementoSpacing.xs,
  },
  funFactText: {
    fontSize: MementoFontSizes.xs,
    color: MementoColors.text.muted,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: MementoSpacing.sm,
    gap: MementoSpacing.xs,
  },
  tag: {
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: 2,
    borderRadius: MementoBorderRadius.sm,
  },
  tagText: {
    fontSize: MementoFontSizes.xs,
    fontWeight: '500',
  },
});
