import { User, CreateUserData } from '@/types/user';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// Collection name
const USERS_COLLECTION = 'users';

// Create a new user document
export const createUser = async (userId: string, userData: CreateUserData): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      stats: {
        totalContacts: 0,
        totalEncounters: 0,
        totalNotes: 0,
        lastActiveAt: Timestamp.now(),
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user data by ID
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        emailVerified: data.emailVerified,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
        preferences: data.preferences || {},
        stats: {
          totalContacts: data.stats?.totalContacts || 0,
          totalEncounters: data.stats?.totalEncounters || 0,
          totalNotes: data.stats?.totalNotes || 0,
          lastActiveAt: data.stats?.lastActiveAt?.toDate() || new Date(),
        }
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user data
export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Update user's last login time
export const updateUserLastLogin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      lastLoginAt: Timestamp.now(),
      'stats.lastActiveAt': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user last login:', error);
    throw error;
  }
};

// Update user stats
export const updateUserStats = async (userId: string, stats: Partial<User['stats']>): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (stats.totalContacts !== undefined) {
      updateData['stats.totalContacts'] = stats.totalContacts;
    }
    if (stats.totalEncounters !== undefined) {
      updateData['stats.totalEncounters'] = stats.totalEncounters;
    }
    if (stats.totalNotes !== undefined) {
      updateData['stats.totalNotes'] = stats.totalNotes;
    }
    if (stats.lastActiveAt !== undefined) {
      updateData['stats.lastActiveAt'] = Timestamp.fromDate(stats.lastActiveAt);
    }
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Check if user exists
export const userExists = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};
