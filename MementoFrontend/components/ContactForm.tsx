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
import { Contact } from '@/types/contact';
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
    funFacts: [] as string[],
    notes: [] as string[],
    encounters: [] as any[],
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
        funFacts: [...contact.funFacts],
        notes: [...contact.notes],
        encounters: [...contact.encounters],
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
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, newNote.trim()]
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
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{note}</Text>
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
    shadowColor: MementoColors.shadow,
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
    borderBottomColor: MementoColors.border.light,
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
    borderColor: MementoColors.border.light,
    borderRadius: MementoBorderRadius.md,
    padding: MementoSpacing.md,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MementoSpacing.sm,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
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
    borderTopColor: MementoColors.border.light,
  },
  cancelButton: {
    flex: 1,
    padding: MementoSpacing.md,
    marginRight: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
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
