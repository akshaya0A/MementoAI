import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Contact } from '@/types/contact';
import { MementoColors, MementoSpacing, MementoFontSizes, MementoBorderRadius } from '@/constants/mementoTheme';

interface ContactCardProps {
  contact: Contact;
  onPress?: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onPress }) => {
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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{contact.avatar}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.role}>{contact.role} at {contact.company}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{contact.lastSeen}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.location}>{contact.location}</Text>
        <Text style={styles.notes} numberOfLines={2}>{contact.notes}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.tagsContainer}>
          {contact.tags.map((tag, index) => (
            <View 
              key={index} 
              style={[styles.tag, { backgroundColor: getTagColor(tag) }]}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.md,
    marginBottom: MementoSpacing.md,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: MementoBorderRadius.full,
    backgroundColor: MementoColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MementoSpacing.md,
  },
  avatar: {
    fontSize: MementoFontSizes.md,
    fontWeight: 'bold',
    color: MementoColors.text.white,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: 2,
  },
  role: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.muted,
  },
  details: {
    marginBottom: MementoSpacing.sm,
  },
  location: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.xs,
  },
  notes: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
