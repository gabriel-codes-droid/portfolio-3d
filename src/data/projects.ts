export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  features: string[];
  color: string;
  texture: string;
  github: string;
  demo: string;
}

export const projects: Project[] = [
  {
    id: 'healthcare-referral-system',
    title: 'Healthcare Referral System',
    description: 'A comprehensive healthcare referral platform that streamlines patient care coordination between hospitals, clinics, and labs. Features secure authentication, real-time appointment scheduling, and medical record management.',
    technologies: ['React', 'TypeScript', 'Express.js', 'MongoDB', 'JWT', 'Node.js'],
    features: [
      'Multi-role user authentication (patients, doctors, hospitals, labs)',
      'Referral management with real-time tracking',
      'Appointment scheduling with automated notifications',
      'Medical record storage with encryption',
      'Lab test result integration',
      'Audit trail for compliance'
    ],
    color: '#00d4ff',
    texture: 'medical',
    github: 'https://github.com/gabriel-mandrake/healthcare-referral-system',
    demo: 'https://healthcare-sympra.vercel.app'
  },
  {
    id: 'dineconnect',
    title: 'DineConnect',
    description: 'A restaurant management platform connecting diners with local restaurants. Features real-time table booking, menu browsing, order placement, and payment processing.',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe API', 'Socket.IO'],
    features: [
      'Real-time table availability tracking',
      'Interactive menu with image gallery',
      'Instant order placement and payment',
      'Restaurant dashboard for order management',
      'Customer review system',
      'Dynamic pricing and promotions'
    ],
    color: '#ff6b35',
    texture: 'restaurant',
    github: 'https://github.com/gabriel-mandrake/dineconnect',
    demo: 'https://dineconnect.vercel.app'
  },
  {
    id: 'kartz',
    title: 'Kartz',
    description: 'An artistic kart racing game built with React Three Fiber. Features customizable karts, multiple tracks, and dynamic weather systems. Pure fun and creativity!',
    technologies: ['React', 'Three.js', 'React Three Fiber', 'GSAP', 'TypeScript'],
    features: [
      '3D kart customization system',
      'Multiple themed racing tracks',
      'Dynamic weather effects',
      'Realistic physics simulation',
      'Multiplayer race modes',
      'Particle effects for boosts and crashes'
    ],
    color: '#a855f7',
    texture: 'kartz',
    github: 'https://github.com/gabriel-mandrake/kartz',
    demo: 'https://kartz-game.vercel.app'
  },
  {
    id: 'personal-management-dashboard',
    title: 'Personal Management Dashboard',
    description: 'A futuristic personal productivity dashboard with task management, habit tracking, analytics, and custom widgets. Everything you need to stay organized.',
    technologies: ['React', 'TypeScript', 'TailwindCSS', 'Charts.js', 'LocalStorage'],
    features: [
      'Task and project management with drag-and-drop',
      'Habit tracking with streak visualization',
      'Productivity analytics and insights',
      'Customizable dashboard widgets',
      'Dark mode with gradient effects',
      'Data export and backup'
    ],
    color: '#06b6d4',
    texture: 'dashboard',
    github: 'https://github.com/gabriel-mandrake/personal-management-dashboard',
    demo: 'https://pmd-gabriel.vercel.app'
  }
];