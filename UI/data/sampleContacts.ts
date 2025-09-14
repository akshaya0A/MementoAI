import { Contact, ContactStats, Event } from '@/types/contact';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Paolo Rossi',
    role: 'Software Engineer',
    company: 'TechCorp',
    email: 'paolo@techcorp.com',
    phone: '+1-555-0123',
    linkedinUrl: 'https://linkedin.com/in/paolorossi',
    githubUrl: 'https://github.com/paolorossi',
    twitterUrl: 'https://twitter.com/paolorossi_dev',
    instagramUrl: 'https://instagram.com/paolo_runs',
    websiteUrl: 'https://paolorossi.dev',
    socialMedia: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/paolorossi', username: 'paolorossi' },
      { platform: 'GitHub', url: 'https://github.com/paolorossi', username: 'paolorossi' },
      { platform: 'Twitter', url: 'https://twitter.com/paolorossi_dev', username: 'paolorossi_dev' },
      { platform: 'Instagram', url: 'https://instagram.com/paolo_runs', username: 'paolo_runs' },
      { platform: 'Website', url: 'https://paolorossi.dev', username: 'paolorossi.dev' }
    ],
    funFacts: ['Speaks 4 languages fluently', 'Marathon runner', 'Coffee enthusiast'],
    whereMet: 'HackMIT networking booth',
    whereFrom: 'Milan, Italy',
    notes: [
      {
        id: 'n1',
        content: 'Loves proactive people and innovative solutions',
        timestamp: new Date('2025-01-10'),
        isVoiceNote: true
      }
    ],
    encounters: [
      {
        id: 'e1',
        event: 'HackMIT',
        location: 'MIT Campus',
        date: new Date('2025-01-10'),
        notes: 'Met at the networking session'
      },
      {
        id: 'e2',
        event: 'HackMIT Career Fair',
        location: 'MIT Campus',
        date: new Date('2025-01-17'),
        notes: 'Follow-up conversation about AI projects'
      }
    ],
    tags: ['MIT', 'AI', 'Hackathon']
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    email: 'sarah@startupxyz.com',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    githubUrl: 'https://github.com/sarahchen',
    twitterUrl: 'https://twitter.com/sarahchen_pm',
    instagramUrl: 'https://instagram.com/sarah_climbs',
    websiteUrl: 'https://sarahchen.co',
    socialMedia: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/sarahchen', username: 'sarahchen' },
      { platform: 'GitHub', url: 'https://github.com/sarahchen', username: 'sarahchen' },
      { platform: 'Twitter', url: 'https://twitter.com/sarahchen_pm', username: 'sarahchen_pm' },
      { platform: 'Instagram', url: 'https://instagram.com/sarah_climbs', username: 'sarah_climbs' },
      { platform: 'Website', url: 'https://sarahchen.co', username: 'sarahchen.co' }
    ],
    funFacts: ['Former startup founder', 'Rock climbing instructor', 'Loves board games'],
    whereMet: 'Tech recruiting dinner table',
    whereFrom: 'San Francisco, CA',
    notes: [
      {
        id: 'n2',
        content: 'Interested in our mobile app development approach',
        timestamp: new Date('2025-01-12')
      }
    ],
    encounters: [
      {
        id: 'e3',
        event: 'Tech Recruiting Dinner',
        location: 'Downtown Restaurant',
        date: new Date('2025-01-12')
      }
    ],
    tags: ['Product', 'Mobile', 'Startup']
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    role: 'Engineering Director',
    company: 'MegaTech Inc',
    email: 'marcus@megatech.com',
    phone: '+1-555-0456',
    linkedinUrl: 'https://linkedin.com/in/marcusjohnson',
    githubUrl: 'https://github.com/marcusj',
    twitterUrl: 'https://twitter.com/marcusj_tech',
    instagramUrl: 'https://instagram.com/marcus_drones',
    websiteUrl: 'https://marcusjohnson.dev',
    socialMedia: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/marcusjohnson', username: 'marcusjohnson' },
      { platform: 'GitHub', url: 'https://github.com/marcusj', username: 'marcusj' },
      { platform: 'Twitter', url: 'https://twitter.com/marcusj_tech', username: 'marcusj_tech' },
      { platform: 'Instagram', url: 'https://instagram.com/marcus_drones', username: 'marcus_drones' },
      { platform: 'Website', url: 'https://marcusjohnson.dev', username: 'marcusjohnson.dev' }
    ],
    funFacts: ['Jazz musician', 'Drone photography hobby', 'Mentors junior developers'],
    whereMet: 'CodeConf speaker lounge',
    whereFrom: 'Austin, TX',
    notes: [
      {
        id: 'n3',
        content: 'Looking for full-stack developers with React experience',
        timestamp: new Date('2025-01-08')
      }
    ],
    encounters: [
      {
        id: 'e4',
        event: 'CodeConf 2025',
        location: 'Convention Center',
        date: new Date('2025-01-08')
      }
    ],
    tags: ['Engineering', 'React', 'Full-stack']
  },
  {
    id: '4',
    name: 'Lisa Park',
    role: 'Talent Acquisition',
    company: 'DataFlow Systems',
    email: 'lisa@dataflow.com',
    linkedinUrl: 'https://linkedin.com/in/lisapark',
    githubUrl: 'https://github.com/lisapark',
    twitterUrl: 'https://twitter.com/lisa_recruits',
    instagramUrl: 'https://instagram.com/lisa_yoga',
    websiteUrl: 'https://lisapark.co',
    socialMedia: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/lisapark', username: 'lisapark' },
      { platform: 'GitHub', url: 'https://github.com/lisapark', username: 'lisapark' },
      { platform: 'Twitter', url: 'https://twitter.com/lisa_recruits', username: 'lisa_recruits' },
      { platform: 'Instagram', url: 'https://instagram.com/lisa_yoga', username: 'lisa_yoga' },
      { platform: 'Website', url: 'https://lisapark.co', username: 'lisapark.co' }
    ],
    funFacts: ['Former data scientist', 'Yoga instructor certification', 'Collects vintage books'],
    whereMet: 'AI Summit expo hall',
    whereFrom: 'Seattle, WA',
    notes: [
      {
        id: 'n4',
        content: 'Specializes in data science and ML roles',
        timestamp: new Date('2025-01-15')
      }
    ],
    encounters: [
      {
        id: 'e5',
        event: 'AI Summit',
        location: 'Tech Hub',
        date: new Date('2025-01-15')
      }
    ],
    tags: ['HR', 'Data Science', 'ML']
  },
  {
    id: '5',
    name: 'Alex Rivera',
    role: 'UX Designer',
    company: 'DesignStudio',
    email: 'alex@designstudio.com',
    phone: '+1-555-0789',
    linkedinUrl: 'https://linkedin.com/in/alexrivera',
    githubUrl: 'https://github.com/alexrivera',
    twitterUrl: 'https://twitter.com/alex_designs',
    instagramUrl: 'https://instagram.com/alex_skates',
    websiteUrl: 'https://alexrivera.design',
    socialMedia: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/alexrivera', username: 'alexrivera' },
      { platform: 'GitHub', url: 'https://github.com/alexrivera', username: 'alexrivera' },
      { platform: 'Twitter', url: 'https://twitter.com/alex_designs', username: 'alex_designs' },
      { platform: 'Instagram', url: 'https://instagram.com/alex_skates', username: 'alex_skates' },
      { platform: 'Website', url: 'https://alexrivera.design', username: 'alexrivera.design' }
    ],
    funFacts: ['Digital nomad for 3 years', 'Published design blogger', 'Skateboards to work'],
    whereMet: 'HackMIT design workshop',
    whereFrom: 'Barcelona, Spain',
    notes: [
      {
        id: 'n5',
        content: 'Passionate about accessible design and user research',
        timestamp: new Date('2025-01-11')
      }
    ],
    encounters: [
      {
        id: 'e6',
        event: 'HackMIT',
        location: 'MIT Campus',
        date: new Date('2025-01-11'),
        notes: 'Connected during the design thinking workshop'
      }
    ],
    tags: ['Design', 'UX', 'Accessibility']
  }
];

export const mockEvents: Event[] = [
  { id: '1', name: 'HackMIT', date: new Date('2025-01-10'), location: 'MIT Campus' },
  { id: '2', name: 'Tech Recruiting Dinner', date: new Date('2025-01-12'), location: 'Downtown Restaurant' },
  { id: '3', name: 'CodeConf 2025', date: new Date('2025-01-08'), location: 'Convention Center' },
  { id: '4', name: 'AI Summit', date: new Date('2025-01-15'), location: 'Tech Hub' },
  { id: '5', name: 'HackMIT Career Fair', date: new Date('2025-01-17'), location: 'MIT Campus' }
];

export const contactStats: ContactStats = {
  totalContacts: 5,
  totalEncounters: 6,
  thisWeek: 0,
  notes: 5
};
