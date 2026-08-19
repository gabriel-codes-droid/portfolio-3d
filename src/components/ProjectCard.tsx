import { useState } from 'react';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectCard({ project, onClose }: ProjectCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  // Drop real screenshots at /public/projects/<id>/1.jpg, 2.jpg, 3.jpg and
  // they'll be used automatically. Until then this falls back to a
  // holographic gradient placeholder in the project's color, so nothing
  // ever shows a broken image.
  const shots = [1, 2, 3].map((n) => `/projects/${project.id}/${n}.jpg`);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <div
      className="relative w-full max-w-4xl max-h-[80vh] rounded-2xl border backdrop-blur-xl flex flex-col md:flex-row overflow-hidden pointer-events-auto"
      style={{
        background: 'linear-gradient(135deg, rgba(15,15,35,0.92), rgba(30,20,60,0.92))',
        borderColor: `${project.color}66`,
        boxShadow: `0 0 40px ${project.color}33, inset 0 0 60px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Scan-line accent */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${project.color}, transparent)` }}
      />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/10"
      >
        ✕
      </button>

      {/* Image / Placeholder Section */}
      <div className="relative w-full md:w-1/2 h-48 md:h-full overflow-hidden">
        {failed[currentImage] ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: `radial-gradient(circle at 50% 40%, ${project.color}55, #0a0a1a 75%)` }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold border"
              style={{ borderColor: `${project.color}88`, color: project.color, boxShadow: `0 0 25px ${project.color}55` }}
            >
              {project.title.charAt(0)}
            </div>
            <p className="text-xs uppercase tracking-widest text-white/40">Preview {currentImage + 1}</p>
          </div>
        ) : (
          <img
            src={shots[currentImage]}
            alt={`${project.title} screenshot ${currentImage + 1}`}
            className="w-full h-full object-cover"
            onError={() => setFailed((f) => ({ ...f, [currentImage]: true }))}
          />
        )}

        {/* Image Navigation */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {shots.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImage(i)}
              className="w-3 h-3 rounded-full transition-all"
              style={{ background: i === currentImage ? project.color : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8 flex flex-col overflow-y-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">{project.title}</h2>

        <p className="text-gray-300 mb-6 leading-relaxed">{project.description}</p>

        {/* Technologies */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: project.color }}>
            Technologies
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-sm rounded-full border"
                style={{ borderColor: `${project.color}55`, background: `${project.color}1a`, color: project.color }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-cyan-300">Features</h3>
          <ul className="space-y-2">
            {project.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <span style={{ color: project.color }} className="mt-1">
                  ▸
                </span>
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col sm:flex-row gap-3">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-full text-white font-medium hover:scale-105 transition-transform text-center"
            style={{ background: `linear-gradient(90deg, ${project.color}, #06b6d4)` }}
          >
            GitHub
          </a>
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-white/10 rounded-full text-white font-medium hover:bg-white/20 transition-colors text-center border border-white/10"
          >
            Live Demo
          </a>
        </div>
      </div>
    </div>
  );
}
