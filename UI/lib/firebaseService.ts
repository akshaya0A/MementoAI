import { Contact } from '@/types/contact';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';

// Collection name
const CONTACTS_COLLECTION = 'contacts';

// Add a new contact
export const addContact = async (contact: Omit<Contact, 'id'>, userId: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
      ...contact,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
};

// Update an existing contact
export const updateContact = async (contactId: string, updates: Partial<Contact>): Promise<void> => {
  try {
    const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
    await updateDoc(contactRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
};

// Delete a contact
export const deleteContact = async (contactId: string): Promise<void> => {
  try {
    const contactRef = doc(db, CONTACTS_COLLECTION, contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
};

// Get all contacts for a specific user
export const getContacts = async (userId: string): Promise<Contact[]> => {
  try {
    const contactsRef = collection(db, CONTACTS_COLLECTION);
    const q = query(
      contactsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Contact[];
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
};

// Get contacts by search term
export const searchContacts = async (searchTerm: string): Promise<Contact[]> => {
  try {
    const contactsRef = collection(db, CONTACTS_COLLECTION);
    const q = query(
      contactsRef,
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Contact[];
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw error;
  }
};

// Get recent contacts (last 30 days)
export const getRecentContacts = async (): Promise<Contact[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const contactsRef = collection(db, CONTACTS_COLLECTION);
    const q = query(
      contactsRef,
      where('updatedAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Contact[];
  } catch (error) {
    console.error('Error getting recent contacts:', error);
    throw error;
  }
};
