// import { addContact, deleteContact, getContacts, updateContact } from '../lib/firebaseService';
// import { Contact } from '../types/contact';
// import { useAuth } from '../contexts/AuthContext';
// import { db } from '../lib/firebase';
// import { useEffect, useState, useCallback } from 'react';

// export const useFirebaseContacts = () => {
//   const { user } = useAuth();
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Load contacts from Firebase
//   const loadContacts = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       if (!user) {
//         console.log('No user authenticated, no contacts to load');
//         setContacts([]);
//         setLoading(false);
//         return;
//       }
      
//       console.log('User authenticated:', {
//         id: user.id,
//         email: user.email,
//         displayName: user.displayName
//       });
      
//       // Also check Firebase auth directly
//       console.log('Firebase auth current user:', auth.currentUser);
//       console.log('Firebase auth email:', auth.currentUser?.email);
      
//       if (!user.email) {
//         console.error('User email is missing!');
//         setError('User email is required to load contacts');
//         setContacts([]);
//         setLoading(false);
//         return;
//       }
      
//       console.log('Loading contacts for user:', user.id, 'email:', user.email);
//       const firebaseContacts = await getContacts(user.id, user.email);
//       console.log('Loaded contacts:', firebaseContacts.length);
//       setContacts(firebaseContacts);
//     } catch (err) {
//       console.error('Error loading contacts from Firebase:', err);
//       console.error('Error details:', {
//         message: err instanceof Error ? err.message : 'Unknown error',
//         code: (err as any)?.code,
//         user: user?.id
//       });
//       setError(`Failed to load contacts from Firebase: ${err instanceof Error ? err.message : 'Unknown error'}`);
//       setContacts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   // Add a new contact
//   const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
//     if (!user) {
//       throw new Error('User not authenticated');
//     }
    
//     try {
//       setError(null);
//       const newContactId = await addContact(contactData, user.id);
//       const newContact: Contact = {
//         ...contactData,
//         id: newContactId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       setContacts(prev => [newContact, ...prev]);
//       return newContactId;
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to add contact');
//       console.error('Error adding contact:', err);
//       throw err;
//     }
//   };

//   // Update an existing contact
//   const handleUpdateContact = async (contactId: string, updates: Partial<Contact>) => {
//     try {
//       setError(null);
//       await updateContact(contactId, updates);
//       setContacts(prev => 
//         prev.map(contact => 
//           contact.id === contactId 
//             ? { ...contact, ...updates, updatedAt: new Date() }
//             : contact
//         )
//       );
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to update contact');
//       console.error('Error updating contact:', err);
//       throw err;
//     }
//   };

//   // Delete a contact
//   const handleDeleteContact = async (contactId: string) => {
//     try {
//       setError(null);
//       await deleteContact(contactId);
//       setContacts(prev => prev.filter(contact => contact.id !== contactId));
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to delete contact');
//       console.error('Error deleting contact:', err);
//       throw err;
//     }
//   };

//   // Load contacts on mount and when user changes
//   useEffect(() => {
//     loadContacts();
//   }, [loadContacts]);

//   return {
//     contacts,
//     loading,
//     error,
//     loadContacts,
//     addContact: handleAddContact,
//     updateContact: handleUpdateContact,
//     deleteContact: handleDeleteContact,
//   };
// };
// services/contacts.ts
import { Contact } from '../types/contact';
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
  Timestamp, updateDoc, where, limit as qLimit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const PEOPLE = 'people';

const mapPersonDoc = (id: string, data: any): Contact => {
  const emails: string[] = data.emails || [];
  return {
    id,
    name: data.displayName || data.name || '',
    role: data.role || data.summary || '',
    company: data.company || '',
    email: data.primaryEmail || emails[0] || '',
    phone: data.phone || '',
    linkedinUrl: data.linkedinUrl || '',
    githubUrl: data.githubUrl || '',
    twitterUrl: data.twitterUrl || '',
    instagramUrl: data.instagramUrl || '',
    websiteUrl: data.websiteUrl || '',
    socialMedia: data.socialMedia || [],
    funFacts: data.funFacts || [],
    whereMet: data.whereMet || '',
    whereFrom: data.whereFrom || '',
    notes: (data.notes || []).map((n: any) => ({
      ...n, timestamp: n.timestamp?.toDate?.() || new Date(),
    })),
    encounters: (data.encounters || []).map((e: any) => ({
      ...e, date: e.date?.toDate?.() || new Date(),
    })),
    tags: data.tags || [],
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
};

// ===== READ EVERYTHING (no owner filter) =====

// Get ALL people (bounded)
export const getAllContacts = async (max = 200): Promise<Contact[]> => {
  try {
    const qy = query(
      collection(db, PEOPLE),
      orderBy('updatedAt', 'desc'),
      qLimit(max)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => mapPersonDoc(d.id, d.data()));
  } catch (e: any) {
    // If Firestore asks for an index, either create it or remove orderBy
    if (e?.code === 'failed-precondition') {
      const snap = await getDocs(query(collection(db, PEOPLE), qLimit(max)));
      return snap.docs
        .map(d => mapPersonDoc(d.id, d.data()))
        .sort((a, b) => +b.updatedAt - +a.updatedAt);
    }
    throw e;
  }
};

// Case-insensitive name search across ALL people
export const searchContactsGlobal = async (term: string, max = 100): Promise<Contact[]> => {
  const t = (term || '').toLowerCase();
  if (!t) return [];
  // requires a stored displayNameLower field to be effective; otherwise drop to client-side filter
  try {
    const qy = query(
      collection(db, PEOPLE),
      where('displayNameLower', '>=', t),
      where('displayNameLower', '<=', t + '\uf8ff'),
      qLimit(max)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => mapPersonDoc(d.id, d.data()));
  } catch (e) {
    // Fallback: fetch some and filter on client
    const seed = await getAllContacts(max);
    return seed.filter(c => c.name.toLowerCase().includes(t));
  }
};

// Recently updated across ALL people
export const getRecentContactsAll = async (days = 30, max = 200): Promise<Contact[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  try {
    const qy = query(
      collection(db, PEOPLE),
      where('updatedAt', '>=', Timestamp.fromDate(since)),
      orderBy('updatedAt', 'desc'),
      qLimit(max)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => mapPersonDoc(d.id, d.data()));
  } catch (e: any) {
    if (e?.code === 'failed-precondition') {
      const seed = await getAllContacts(max);
      return seed.filter(c => +c.updatedAt >= +since);
    }
    throw e;
  }
};

// ===== your existing write ops can stay as-is (no owner checks) =====

export const addContact = async (contact: Omit<Contact, 'id'>): Promise<string> => {
  const now = Timestamp.now();
  const payload: any = {
    displayName: contact.name || '',
    displayNameLower: (contact.name || '').toLowerCase(),
    summary: contact.role || '',
    company: contact.company || '',
    primaryEmail: contact.email || '',
    emails: contact.email ? [contact.email] : [],
    phone: contact.phone || '',
    linkedinUrl: contact.linkedinUrl || '',
    githubUrl: contact.githubUrl || '',
    twitterUrl: contact.twitterUrl || '',
    instagramUrl: contact.instagramUrl || '',
    websiteUrl: contact.websiteUrl || '',
    socialMedia: contact.socialMedia || [],
    funFacts: contact.funFacts || [],
    whereMet: contact.whereMet || '',
    whereFrom: contact.whereFrom || '',
    notes: contact.notes || [],
    encounters: contact.encounters || [],
    tags: contact.tags || [],
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, PEOPLE), payload);
  return ref.id;
};

export const updateContact = async (contactId: string, updates: Partial<Contact>): Promise<void> => {
  const ref = doc(db, PEOPLE, contactId);
  const payload: any = { updatedAt: Timestamp.now() };
  if (updates.name !== undefined) {
    payload.displayName = updates.name;
    payload.displayNameLower = updates.name.toLowerCase();
  }
  if (updates.role !== undefined) payload.summary = updates.role;
  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.email !== undefined) {
    payload.primaryEmail = updates.email;
    payload.emails = updates.email ? [updates.email] : [];
  }
  [
    'phone','linkedinUrl','githubUrl','twitterUrl','instagramUrl','websiteUrl',
    'socialMedia','funFacts','whereMet','whereFrom','notes','encounters','tags'
  ].forEach(k => (updates as any)[k] !== undefined && (payload[k] = (updates as any)[k]));
  await updateDoc(ref, payload);
};

export const deleteContact = async (contactId: string): Promise<void> => {
  await deleteDoc(doc(db, PEOPLE, contactId));
};

// Hook implementation
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useCallback } from 'react';

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
      
      console.log('Loading contacts from Firestore...');
      const firebaseContacts = await getAllContacts();
      console.log('Loaded contacts:', firebaseContacts.length);
      setContacts(firebaseContacts);
    } catch (err) {
      console.error('Error loading contacts from Firebase:', err);
      setError(`Failed to load contacts from Firebase: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
