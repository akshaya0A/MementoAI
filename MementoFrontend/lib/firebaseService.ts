import { Contact } from '../types/contact';
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
const CONTACTS_COLLECTION = 'people';

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
export const getContacts = async (userId: string, userEmail?: string): Promise<Contact[]> => {
  try {
    console.log('Getting contacts from collection:', CONTACTS_COLLECTION, 'for user:', userId, 'email:', userEmail);
    console.log('Firebase db instance:', db);
    console.log('Firebase app:', db.app);
    
    const contactsRef = collection(db, CONTACTS_COLLECTION);
    console.log('Collection reference created:', contactsRef);
    
    // Try querying by email first (as seen in the Firestore document)
    const ownerField = userEmail || userId;
    console.log('Using owner field:', ownerField);
    
    // The owner field is an object like { "email@domain.com": "true" }
    // We need to query for the specific key in the owner object
    let q = query(
      contactsRef, 
      where(`owner.${ownerField}`, '==', true)
    );
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('Query executed, found', querySnapshot.docs.length, 'documents');
    
    // If no documents found, try a simple query to see if collection has any data
    if (querySnapshot.docs.length === 0) {
      console.log('No documents found with owner query, trying to get all documents...');
      const allDocsQuery = query(contactsRef);
      const allDocsSnapshot = await getDocs(allDocsQuery);
      console.log('All documents in collection:', allDocsSnapshot.docs.length);
      
      if (allDocsSnapshot.docs.length > 0) {
        console.log('Sample document structure:', allDocsSnapshot.docs[0].data());
        console.log('Sample document owner field:', allDocsSnapshot.docs[0].data().owner);
        console.log('Looking for owner field with value:', ownerField);
        
        // Try to find documents that match our owner field
        const matchingDocs = allDocsSnapshot.docs.filter(doc => {
          const owner = doc.data().owner;
          return owner && owner[ownerField] === true;
        });
        console.log('Documents matching owner field:', matchingDocs.length);
        
        if (matchingDocs.length > 0) {
          console.log('Found matching documents, processing them...');
          return matchingDocs.map(doc => {
            const data = doc.data();
            console.log('Processing matching document:', doc.id, 'with data:', data);
            
            // Get primary email from emails array
            const primaryEmail = data.emails && data.emails.length > 0 ? data.emails[0] : '';
            
            return {
              id: doc.id,
              name: data.displayName || '',
              role: data.summary || '',
              company: data.company || '',
              email: primaryEmail,
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
              notes: (data.notes || []).map((note: any) => ({
                ...note,
                timestamp: note.timestamp?.toDate() || new Date()
              })),
              encounters: (data.encounters || []).map((encounter: any) => ({
                ...encounter,
                date: encounter.date?.toDate() || new Date()
              })),
              tags: data.tags || [],
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Contact;
          });
        }
      }
    }
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Processing document:', doc.id, 'with data:', data);
      
      // Get primary email from emails array
      const primaryEmail = data.emails && data.emails.length > 0 ? data.emails[0] : '';
      
      return {
        id: doc.id,
        name: data.displayName || '',
        role: data.summary || '',
        company: data.company || '',
        email: primaryEmail,
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
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          timestamp: note.timestamp?.toDate() || new Date()
        })),
        encounters: (data.encounters || []).map((encounter: any) => ({
          ...encounter,
          date: encounter.date?.toDate() || new Date()
        })),
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Contact;
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    console.error('Error code:', (error as any)?.code);
    console.error('Error message:', (error as any)?.message);
    
    // Try a simpler query without orderBy in case of index issues
    if ((error as any)?.code === 'failed-precondition') {
      console.log('Trying fallback query without orderBy...');
      try {
        const contactsRef = collection(db, CONTACTS_COLLECTION);
        const ownerField = userEmail || userId;
        const q = query(contactsRef, where(`owner.${ownerField}`, '==', true));
        const querySnapshot = await getDocs(q);
        console.log('Fallback query executed, found', querySnapshot.docs.length, 'documents');
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing fallback document:', doc.id, 'with data:', data);
          
          // Get primary email from emails array
          const primaryEmail = data.emails && data.emails.length > 0 ? data.emails[0] : '';
          
          return {
            id: doc.id,
            name: data.displayName || '',
            role: data.summary || '',
            company: data.company || '',
            email: primaryEmail,
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
            notes: (data.notes || []).map((note: any) => ({
              ...note,
              timestamp: note.timestamp?.toDate() || new Date()
            })),
            encounters: (data.encounters || []).map((encounter: any) => ({
              ...encounter,
              date: encounter.date?.toDate() || new Date()
            })),
            tags: data.tags || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Contact;
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
    
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
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        role: data.role || '',
        company: data.company || '',
        email: data.email,
        phone: data.phone,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        twitterUrl: data.twitterUrl,
        instagramUrl: data.instagramUrl,
        websiteUrl: data.websiteUrl,
        socialMedia: data.socialMedia || [],
        funFacts: data.funFacts || [],
        whereMet: data.whereMet || '',
        whereFrom: data.whereFrom || '',
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          timestamp: note.timestamp?.toDate() || new Date()
        })),
        encounters: (data.encounters || []).map((encounter: any) => ({
          ...encounter,
          date: encounter.date?.toDate() || new Date()
        })),
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Contact;
    });
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
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        role: data.role || '',
        company: data.company || '',
        email: data.email,
        phone: data.phone,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        twitterUrl: data.twitterUrl,
        instagramUrl: data.instagramUrl,
        websiteUrl: data.websiteUrl,
        socialMedia: data.socialMedia || [],
        funFacts: data.funFacts || [],
        whereMet: data.whereMet || '',
        whereFrom: data.whereFrom || '',
        notes: (data.notes || []).map((note: any) => ({
          ...note,
          timestamp: note.timestamp?.toDate() || new Date()
        })),
        encounters: (data.encounters || []).map((encounter: any) => ({
          ...encounter,
          date: encounter.date?.toDate() || new Date()
        })),
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Contact;
    });
  } catch (error) {
    console.error('Error getting recent contacts:', error);
    throw error;
  }
};

// Deep Research API call
export const callDeepResearchAPI = async (name: string, summary: string): Promise<any> => {
  try {
    const response = await fetch('https://mementoai-backend-528890859039.us-central1.run.app/deepResearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        summary: summary
      })
    });

    if (!response.ok) {
      throw new Error(`Deep research API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Deep research API response:', data);
    return data;
  } catch (error) {
    console.error('Error calling deep research API:', error);
    throw error;
  }
};
