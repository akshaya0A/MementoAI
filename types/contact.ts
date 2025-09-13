export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  avatar: string;
  tags: string[];
  notes: string;
  lastSeen: string;
  encounters: number;
  interests: string[];
  connections: string[];
}

export interface ContactStats {
  totalContacts: number;
  totalEncounters: number;
  thisWeek: number;
  notes: number;
}

export interface ContactEvent {
  id: string;
  contactId: string;
  type: 'meeting' | 'call' | 'email' | 'event';
  date: string;
  location?: string;
  notes?: string;
  tags: string[];
}

export type FilterType = 'All Events' | 'Meetings' | 'Calls' | 'Emails';
export type TagFilter = 'All Tags' | string;
export type SortType = 'Recent' | 'Name' | 'Company' | 'Last Seen';
