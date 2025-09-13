import { Contact, ContactStats } from '@/types/contact';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Paolo Rossi',
    role: 'Software Engineer',
    company: 'TechCorp',
    location: 'Milan, Italy',
    avatar: 'PR',
    tags: ['MIT', 'AI', '+1'],
    notes: 'Loves proactive people and innovative solutions',
    lastSeen: 'Jan 16',
    encounters: 2,
    interests: ['HackMIT Career Fair'],
    connections: ['Met at: HackMIT networking booth']
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    avatar: 'SC',
    tags: ['Product', 'Mobile', '+1'],
    notes: 'Interested in our mobile app development approach',
    lastSeen: 'Jan 11',
    encounters: 1,
    interests: ['Tech Recruiting Dinner'],
    connections: ['Met at: Tech recruiting dinner table']
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    role: 'Engineering Director',
    company: 'MegaTech',
    location: 'Austin, TX',
    avatar: 'MJ',
    tags: ['Engineering', 'React', '+1'],
    notes: 'Looking for full-stack developers with React experience',
    lastSeen: 'Jan 7',
    encounters: 1,
    interests: ['CodeConf 2025'],
    connections: ['Met at: CodeConf speaker lounge']
  },
  {
    id: '4',
    name: 'Lisa Park',
    role: 'Talent Acquisition',
    company: 'DataFlow Systems',
    location: 'Seattle, WA',
    avatar: 'LP',
    tags: ['HR', 'Data Science', '+1'],
    notes: 'Specializes in data science and ML roles',
    lastSeen: 'Jan 14',
    encounters: 1,
    interests: ['AI Summit'],
    connections: ['Met at: AI Summit expo hall']
  },
  {
    id: '5',
    name: 'Alex Rivera',
    role: 'UX Designer',
    company: 'DesignStudio',
    location: 'Barcelona, Spain',
    avatar: 'AR',
    tags: ['Design', 'UX', '+1'],
    notes: 'Passionate about accessible design and user research',
    lastSeen: 'Jan 10',
    encounters: 1,
    interests: ['HackMIT'],
    connections: ['Met at: HackMIT design workshop']
  }
];

export const contactStats: ContactStats = {
  totalContacts: 5,
  totalEncounters: 6,
  thisWeek: 0,
  notes: 5
};
