import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Contact, Note, Encounter } from '@/types/contact';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing } from '@/constants/mementoTheme';
import { IconSymbol } from './ui/icon-symbol';

interface ContactFormProps {
  contact?: Contact;
  onSave: (contactData: Omit<Contact, 'id'>) => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    whereFrom: '',
    whereMet: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    websiteUrl: '',
    deepResearchArea: '',
    funFacts: [] as string[],
    notes: [] as Note[],
    encounters: [] as Encounter[],
    socialMedia: [] as any[],
    tags: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [newFunFact, setNewFunFact] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        company: contact.company,
        role: contact.role,
        whereFrom: contact.whereFrom,
        whereMet: contact.whereMet,
        email: contact.email || '',
        phone: contact.phone || '',
        linkedinUrl: contact.linkedinUrl || '',
        githubUrl: contact.githubUrl || '',
        twitterUrl: contact.twitterUrl || '',
        instagramUrl: contact.instagramUrl || '',
        websiteUrl: contact.websiteUrl || '',
        deepResearchArea: contact.deepResearchArea || '',
        funFacts: [...contact.funFacts],
        notes: [...contact.notes],
        encounters: [...contact.encounters],
        socialMedia: [...contact.socialMedia],
        tags: [...contact.tags],
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      });
    }
  }, [contact]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    onSave(formData);
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

  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: new Date(),
        isVoiceNote: false
      };
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, note]
      }));
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <IconSymbol name="xmark" size={20} color={MementoColors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={styles.input}
                value={formData.company}
                onChangeText={(text) => setFormData(prev => ({ ...prev, company: text }))}
                placeholder="Enter company name"
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <TextInput
                style={styles.input}
                value={formData.role}
                onChangeText={(text) => setFormData(prev => ({ ...prev, role: text }))}
                placeholder="Enter job title or role"
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Where From</Text>
              <TextInput
                style={styles.input}
                value={formData.whereFrom}
                onChangeText={(text) => setFormData(prev => ({ ...prev, whereFrom: text }))}
                placeholder="e.g., LinkedIn, Conference, Mutual friend"
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Where Met</Text>
              <TextInput
                style={styles.input}
                value={formData.whereMet}
                onChangeText={(text) => setFormData(prev => ({ ...prev, whereMet: text }))}
                placeholder="e.g., Coffee shop, Office, Event"
                placeholderTextColor={MementoColors.text.muted}
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Social Media & Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Media & Links</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>LinkedIn URL</Text>
              <TextInput
                style={styles.input}
                value={formData.linkedinUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, linkedinUrl: text }))}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GitHub URL</Text>
              <TextInput
                style={styles.input}
                value={formData.githubUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, githubUrl: text }))}
                placeholder="https://github.com/username"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>X (Twitter) URL</Text>
              <TextInput
                style={styles.input}
                value={formData.twitterUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, twitterUrl: text }))}
                placeholder="https://x.com/username"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instagram URL</Text>
              <TextInput
                style={styles.input}
                value={formData.instagramUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instagramUrl: text }))}
                placeholder="https://instagram.com/username"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website URL</Text>
              <TextInput
                style={styles.input}
                value={formData.websiteUrl}
                onChangeText={(text) => setFormData(prev => ({ ...prev, websiteUrl: text }))}
                placeholder="https://personal-website.com"
                placeholderTextColor={MementoColors.text.muted}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Research & Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Research & Description</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deep Research Area</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.deepResearchArea}
                onChangeText={(text) => setFormData(prev => ({ ...prev, deepResearchArea: text }))}
                placeholder="Describe their area of expertise, research interests, or professional focus"
                placeholderTextColor={MementoColors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Fun Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fun Facts</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newFunFact}
                onChangeText={setNewFunFact}
                placeholder="Add a fun fact about this person"
                placeholderTextColor={MementoColors.text.muted}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFunFact}>
                <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
              </TouchableOpacity>
            </View>

            {formData.funFacts.map((fact, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{fact}</Text>
                <TouchableOpacity onPress={() => removeFunFact(index)}>
                  <IconSymbol name="trash" size={14} color={MementoColors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            
            <View style={styles.addItemContainer}>
              <TextInput
                style={styles.addItemInput}
                value={newNote}
                onChangeText={setNewNote}
                placeholder="Add a note about this person"
                placeholderTextColor={MementoColors.text.muted}
              />
              <TouchableOpacity style={styles.addButton} onPress={addNote}>
                <IconSymbol name="plus" size={16} color={MementoColors.text.white} />
              </TouchableOpacity>
            </View>

            {formData.notes.map((note, index) => (
              <View key={note.id} style={styles.listItem}>
                <Text style={styles.listItemText}>{note.content}</Text>
                <TouchableOpacity onPress={() => removeNote(index)}>
                  <IconSymbol name="trash" size={14} color={MementoColors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: MementoColors.background,
    borderRadius: MementoBorderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: MementoSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.borderLight,
  },
  title: {
    fontSize: MementoFontSizes.xl,
    fontWeight: 'bold',
    color: MementoColors.text.primary,
  },
  closeButton: {
    padding: MementoSpacing.sm,
  },
  content: {
    maxHeight: 400,
    padding: MementoSpacing.lg,
  },
  section: {
    marginBottom: MementoSpacing.xl,
  },
  sectionTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.md,
  },
  inputGroup: {
    marginBottom: MementoSpacing.md,
  },
  label: {
    fontSize: MementoFontSizes.sm,
    fontWeight: '500',
    color: MementoColors.text.primary,
    marginBottom: MementoSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: MementoColors.borderLight,
    borderRadius: MementoBorderRadius.md,
    padding: MementoSpacing.md,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: MementoColors.borderLight,
    borderRadius: MementoBorderRadius.md,
    padding: MementoSpacing.md,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    backgroundColor: MementoColors.backgroundSecondary,
    marginRight: MementoSpacing.sm,
  },
  addButton: {
    backgroundColor: MementoColors.primary,
    borderRadius: MementoBorderRadius.md,
    padding: MementoSpacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    padding: MementoSpacing.md,
    marginBottom: MementoSpacing.sm,
  },
  listItemText: {
    flex: 1,
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: MementoSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: MementoColors.borderLight,
  },
  cancelButton: {
    flex: 1,
    padding: MementoSpacing.md,
    marginRight: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: MementoSpacing.md,
    marginLeft: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.white,
    fontWeight: '600',
  },
});
