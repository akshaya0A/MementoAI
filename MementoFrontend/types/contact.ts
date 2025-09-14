export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  deepResearchArea?: string; // Deep research area for description
  deepResearchEnabled?: boolean; // Whether deep research is enabled for this contact
  deepResearchData?: any; // JSON data received from deep research API
  socialMedia: {
    platform: string;
    url: string;
    username?: string;
  }[];
  funFacts: string[];
  whereMet: string;
  whereFrom: string; // Location/city they're from
  notes: Note[];
  encounters: Encounter[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  content: string;
  timestamp: Date;
  isVoiceNote?: boolean;
}

export interface Encounter {
  id: string;
  event: string;
  location: string;
  date: Date;
  notes?: string;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
}

export interface ContactStats {
  totalContacts: number;
  totalEncounters: number;
  thisWeek: number;
  notes: number;
}

export type FilterType = 'All Events' | 'Meetings' | 'Calls' | 'Emails';
export type TagFilter = 'All Tags' | string;
export type SortType = 'Recent' | 'Name' | 'Company' | 'Last Seen';
