export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    language?: string;
  };
  stats?: {
    totalContacts: number;
    totalEncounters: number;
    totalNotes: number;
    lastActiveAt: Date;
  };
}

export interface CreateUserData {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    notifications?: boolean;
    language?: string;
  };
}
