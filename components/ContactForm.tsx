import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { Contact } from '@/types/contact';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContactFormProps {
  contact?: Contact;
  onSave: (contact: Omit<Contact, 'id'>) => void;
  onCancel: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    funFacts: [] as string[],
    whereMet: '',
    whereFrom: '',
    notes: [] as any[],
    encounters: [] as any[],
    tags: [] as string[],
  });

  const [newFunFact, setNewFunFact] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        role: contact.role,
        company: contact.company,
        email: contact.email || '',
        phone: contact.phone || '',
        linkedinUrl: contact.linkedinUrl || '',
        githubUrl: contact.githubUrl || '',
        twitterUrl: contact.twitterUrl || '',
        instagramUrl: contact.instagramUrl || '',
        websiteUrl: contact.websiteUrl || '',
        funFacts: contact.funFacts || [],
        whereMet: contact.whereMet,
        whereFrom: contact.whereFrom,
        notes: contact.notes || [],
        encounters: contact.encounters || [],
        tags: contact.tags || [],
      });
    }
  }, [contact]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.company.trim()) {
      Alert.alert('Error', 'Please fill in name, role, and company fields.');
      return;
    }

    const socialMedia = [];
    if (formData.linkedinUrl) socialMedia.push({ platform: 'LinkedIn', url: formData.linkedinUrl, username: formData.linkedinUrl.split('/').pop() });
    if (formData.githubUrl) socialMedia.push({ platform: 'GitHub', url: formData.githubUrl, username: formData.githubUrl.split('/').pop() });
    if (formData.twitterUrl) socialMedia.push({ platform: 'Twitter', url: formData.twitterUrl, username: formData.twitterUrl.split('/').pop() });
    if (formData.instagramUrl) socialMedia.push({ platform: 'Instagram', url: formData.instagramUrl, username: formData.instagramUrl.split('/').pop() });
    if (formData.websiteUrl) socialMedia.push({ platform: 'Website', url: formData.websiteUrl, username: formData.websiteUrl });

    onSave({
      ...formData,
      socialMedia,
    });
  };

  const addFunFact = () => {
    if (newFunFact.trim()) {
      setFormData(prev => ({
        ...prev,
        funFacts: [...prev.funFacts, newFunFact.trim()]
      }));
      setNewFunFact('');
    }
  };

  const removeFunFact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      funFacts: prev.funFacts.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <IconSymbol name="xmark" size={20} color={MementoColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>{contact ? 'Edit Contact' : 'Add Contact'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role *</Text>
            <TextInput
              style={styles.input}
              value={formData.role}
              onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
              placeholder="e.g., Software Engineer"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company *</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData(prev => ({ ...prev, company: text }))}
              placeholder="e.g., TechCorp"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="email@company.com"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="+1-555-0123"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media & Links</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>LinkedIn URL</Text>
            <TextInput
              style={styles.input}
              value={formData.linkedinUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, linkedinUrl: text }))}
              placeholder="https://linkedin.com/in/username"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GitHub URL</Text>
            <TextInput
              style={styles.input}
              value={formData.githubUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, githubUrl: text }))}
              placeholder="https://github.com/username"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website URL</Text>
            <TextInput
              style={styles.input}
              value={formData.websiteUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, websiteUrl: text }))}
              placeholder="https://yourwebsite.com"
            />
          </View>
        </View>

        {/* Context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where did you meet?</Text>
            <TextInput
              style={styles.input}
              value={formData.whereMet}
              onChangeText={(text) => setFormData(prev => ({ ...prev, whereMet: text }))}
              placeholder="e.g., HackMIT networking booth"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where are they from?</Text>
            <TextInput
              style={styles.input}
              value={formData.whereFrom}
              onChangeText={(text) => setFormData(prev => ({ ...prev, whereFrom: text }))}
              placeholder="e.g., San Francisco, CA"
            />
          </View>
        </View>

        {/* Fun Facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fun Facts</Text>
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              value={newFunFact}
              onChangeText={setNewFunFact}
              placeholder="Add a fun fact about this person"
            />
            <TouchableOpacity style={styles.addButton} onPress={addFunFact}>
              <IconSymbol name="plus" size={16} color={MementoColors.primary} />
            </TouchableOpacity>
          </View>

          {formData.funFacts.map((fact, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{fact}</Text>
              <TouchableOpacity onPress={() => removeFunFact(index)}>
                <IconSymbol name="trash" size={16} color={MementoColors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.input, styles.addItemInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag"
            />
            <TouchableOpacity style={styles.addButton} onPress={addTag}>
              <IconSymbol name="plus" size={16} color={MementoColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            {formData.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <IconSymbol name="xmark" size={12} color={MementoColors.text.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.backgroundSecondary,
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
  cancelButton: {
    padding: MementoSpacing.sm,
  },
  title: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  saveButton: {
    padding: MementoSpacing.sm,
  },
  saveButtonText: {
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
    color: MementoColors.primary,
  },
  section: {
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    marginBottom: MementoSpacing.sm,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  inputGroup: {
    marginBottom: MementoSpacing.md,
  },
  label: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    borderRadius: MementoBorderRadius.md,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    backgroundColor: MementoColors.background,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  addItemInput: {
    flex: 1,
    marginRight: MementoSpacing.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: MementoSpacing.sm,
    paddingHorizontal: MementoSpacing.md,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    marginBottom: MementoSpacing.xs,
  },
  itemText: {
    flex: 1,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: MementoSpacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
    gap: MementoSpacing.xs,
  },
  tagText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.white,
  },
});
