import { useState, useEffect } from 'react';

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollY < windowHeight) {
        setActiveSection('home');
      } else if (scrollY < windowHeight * 2) {
        setActiveSection('about');
      } else {
        setActiveSection('projects');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed right-8 bottom-1/2 flex flex-col gap-4 z-20">
      {/* Social Links */}
      <div className="flex flex-col gap-3">
        <a
          href="https://github.com/gabriel-mandrake"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.627 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387-1.142.205-2.034.547-2.342.969-.193.378-.378.971-.442 1.453-.175 1.086.193 2.146.793 2.729-1.237.056-2.548-.283-3.524-.885-.684-.41-1.007-.998-1.007-1.751 0-1.365.987-2.507 2.216-2.702-.362-.618-1.551-1.582-2.549-1.642-.612-.325-.35.667-.35.667.566.313 1.006.109 1.154.085.311-.625 1.823-.444 2.152-.296.335-.158 1.222-.686 2.252-.45" />
          </svg>
        </a>
        <a
          href="https://linkedin.com/in/gabriel-mandrake"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19v-10h-3v-10h3v10h3v-10h3v10h-3v6z" />
          </svg>
        </a>
      </div>

      {/* Section Indicators */}
      <div className="absolute top-1/2 left-6 flex flex-col gap-3">
        <button
          onClick={() => {
            if (document.querySelector('[data-project-section]')) {
              document.querySelector('[data-project-section]')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm ${
            activeSection === 'projects'
              ? 'bg-purple-600/50 text-purple-300'
              : 'bg-white/5 hover:bg-white/10 text-gray-400'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            activeSection === 'projects' ? 'bg-purple-400' : 'bg-gray-500'
          }`} />
          Projects
        </button>
      </div>
    </div>
  );
}