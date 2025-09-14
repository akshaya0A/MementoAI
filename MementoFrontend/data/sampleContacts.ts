import { Contact, ContactStats, Event } from '../types/contact';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Test User',
    role: 'Software Engineer',
    company: 'Test Company',
    email: 'test@example.com',
    phone: '+1 (555) 123-4567',
    linkedinUrl: 'https://linkedin.com/in/testuser',
    githubUrl: 'https://github.com/testuser',
    twitterUrl: 'https://x.com/testuser',
    instagramUrl: 'https://instagram.com/testuser',
    websiteUrl: 'https://testuser.com',
    deepResearchArea: 'Test research area',
    socialMedia: [],
    funFacts: ['Loves testing'],
    whereMet: 'Test event',
    whereFrom: 'Test City',
    notes: [],
    encounters: [],
    tags: ['Test'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockEvents: Event[] = [];

export const contactStats: ContactStats = {
  totalContacts: 1,
  totalEncounters: 0,
  thisWeek: 0,
  notes: 0
};
