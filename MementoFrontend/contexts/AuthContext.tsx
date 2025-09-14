import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithPopup,
  GoogleAuthProvider, 
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { User } from '@/types/user';
import { createUser, getUser, updateUserLastLogin, userExists } from '@/lib/userService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          console.log('Processing Firebase user:', firebaseUser.uid, firebaseUser.email);
          
          // Check if user document exists in Firestore
          const Exists = await checkUserExists(firebaseUser.uid);
          console.log('User exists in Firestore:', Exists);
          
          if (Exists) {
            // Get existing user data
            console.log('Loading existing user data...');
            const userData = await getUser(firebaseUser.uid);
            console.log('Loaded user data:', userData);
            setUser(userData);
            // Update last login time
            await updateUserLastLogin(firebaseUser.uid);
          } else {
            // Create new user document
            console.log('Creating new user document...');
            await createNewUser(firebaseUser);
            console.log('New user created, loading user data...');
            // Get the newly created user data
            const userData = await getUser(firebaseUser.uid);
            console.log('Loaded new user data:', userData);
            setUser(userData);
          }
        } catch (error) {
          console.error('Error handling user data:', error);
          console.error('Error details:', error);
          // Set user to null if there's an error
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Create Google Auth Provider
      const provider = new GoogleAuthProvider();
      
      // Sign in with Google popup (works on web)
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in successful:', result.user);
      
      // The onAuthStateChanged listener will handle the state update
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-Out Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user exists in Firestore
  const checkUserExists = async (userId: string): Promise<boolean> => {
    return await userExists(userId);
  };

  // Helper function to create new user in Firestore
  const createNewUser = async (firebaseUser: FirebaseUser): Promise<void> => {
    const userData = {
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      preferences: {
        theme: 'light' as const,
        notifications: true,
        language: 'en'
      }
    };
    
    await createUser(firebaseUser.uid, userData);
    console.log('New user created in Firestore:', firebaseUser.uid);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
