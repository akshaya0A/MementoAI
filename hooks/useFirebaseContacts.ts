import { addContact, deleteContact, getContacts, updateContact } from '@/lib/firebaseService';
import { Contact } from '@/types/contact';
import { useEffect, useState } from 'react';

export const useFirebaseContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts from Firebase
  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const firebaseContacts = await getContacts();
      setContacts(firebaseContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new contact
  const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
    try {
      setError(null);
      const newContactId = await addContact(contactData);
      const newContact: Contact = {
        ...contactData,
        id: newContactId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContacts(prev => [newContact, ...prev]);
      return newContactId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      console.error('Error adding contact:', err);
      throw err;
    }
  };

  // Update an existing contact
  const handleUpdateContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      setError(null);
      await updateContact(contactId, updates);
      setContacts(prev => 
        prev.map(contact => 
          contact.id === contactId 
            ? { ...contact, ...updates, updatedAt: new Date() }
            : contact
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      console.error('Error updating contact:', err);
      throw err;
    }
  };

  // Delete a contact
  const handleDeleteContact = async (contactId: string) => {
    try {
      setError(null);
      await deleteContact(contactId);
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
      console.error('Error deleting contact:', err);
      throw err;
    }
  };

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    loadContacts,
    addContact: handleAddContact,
    updateContact: handleUpdateContact,
    deleteContact: handleDeleteContact,
  };
};
