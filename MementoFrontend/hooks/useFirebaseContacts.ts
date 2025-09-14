import { addContact, deleteContact, getContacts, updateContact } from '@/lib/firebaseService';
import { Contact } from '@/types/contact';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { mockContacts } from '@/data/sampleContacts';

export const useFirebaseContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load contacts from Firebase
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        // Use sample data when no user is authenticated
        console.log('No user authenticated, using sample contacts');
        setContacts(mockContacts);
        setLoading(false);
        return;
      }
      
      const firebaseContacts = await getContacts(user.id);
      setContacts(firebaseContacts);
    } catch (err) {
      console.error('Error loading contacts from Firebase:', err);
      // Fallback to sample data if Firebase fails
      console.log('Firebase failed, using sample contacts as fallback');
      setContacts(mockContacts);
      setError('Using sample data - Firebase connection failed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a new contact
  const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    try {
      setError(null);
      const newContactId = await addContact(contactData, user.id);
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

  // Load contacts on mount and when user changes
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
