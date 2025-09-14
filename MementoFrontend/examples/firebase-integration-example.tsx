// Example of how to integrate Firebase into your MementoAI app
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FirebaseIntegrationExample() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useFirebaseContacts();
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Example: Add a test contact
  const handleAddTestContact = async () => {
    try {
      const testContact: Omit<Contact, 'id'> = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        position: 'Software Engineer',
        notes: ['Met at conference', 'Interested in AI'],
        encounters: [
          {
            date: new Date().toISOString(),
            location: 'Tech Conference 2024',
            notes: 'Great conversation about AI trends',
            tags: ['networking', 'ai']
          }
        ],
        tags: ['developer', 'ai'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addContact(testContact);
      Alert.alert('Success', 'Test contact added to Firebase!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  // Example: Update a contact
  const handleUpdateContact = async (contactId: string) => {
    try {
      await updateContact(contactId, {
        notes: [...(contacts.find(c => c.id === contactId)?.notes || []), 'Updated via Firebase'],
        updatedAt: new Date()
      });
      Alert.alert('Success', 'Contact updated in Firebase!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact');
    }
  };

  // Example: Delete a contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      Alert.alert('Success', 'Contact deleted from Firebase!');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading contacts from Firebase...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Integration Example</Text>
      <Text style={styles.subtitle}>Contacts loaded from Firebase: {contacts.length}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleAddTestContact}>
        <Text style={styles.buttonText}>Add Test Contact to Firebase</Text>
      </TouchableOpacity>

      {contacts.map((contact) => (
        <View key={contact.id} style={styles.contactItem}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactEmail}>{contact.email}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={() => handleUpdateContact(contact.id)}
            >
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => handleDeleteContact(contact.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  contactItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  updateButton: {
    backgroundColor: '#34C759',
    padding: 8,
    borderRadius: 4,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 4,
    flex: 1,
  },
});
