import { useState, useCallback } from 'react';
import { Contact } from '@/types/contact';
import { mockContacts } from '@/data/sampleContacts';

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  const addContact = useCallback((contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(), // Simple ID generation
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === id ? { ...contact, ...updates } : contact
      )
    );
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id));
  }, []);

  const getContactById = useCallback((id: string) => {
    return contacts.find(contact => contact.id === id);
  }, [contacts]);

  const searchContacts = useCallback((query: string) => {
    if (!query.trim()) return contacts;
    
    const lowercaseQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.company.toLowerCase().includes(lowercaseQuery) ||
      contact.role.toLowerCase().includes(lowercaseQuery) ||
      contact.email?.toLowerCase().includes(lowercaseQuery) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [contacts]);

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    getContactById,
    searchContacts,
  };
};
