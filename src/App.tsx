import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, useGLTF, useFBX, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { gsap } from 'gsap';
import IntroScene from './scenes/IntroScene';
import ProjectSystems from './scenes/ProjectSystems';
import type { PlanetNavAPI } from './scenes/ProjectSystems';
import Navigation from './components/Navigation';
import ProjectCard from './components/ProjectCard';
import CameraRig from './components/CameraRig';
import Mannequin from './components/Mannequin';
import Jetpack from './components/Jetpack';
import HDRIEnvironment from './components/HDRIEnvironment';
import { useMannequinJourney } from './hooks/useMannequinJourney';
import type { Project } from './data/projects';
import { MOON_CENTER, MOON_RADIUS } from './moonConstants';

// The seat position is computed to sit exactly ON the moon's actual
// rendered surface (see MoonModel.tsx, which auto-scales to MOON_RADIUS) —
// at the exact center/top so the mannequin sits in the middle of the moon.
const MOON_SEAT_POSITION: [number, number, number] = [
  MOON_CENTER[0],
  MOON_CENTER[1] + MOON_RADIUS,
  MOON_CENTER[2],
];
// Just beside the seat, same distance from center so it also rests on the surface
const JETPACK_DROP_POSITION: [number, number, number] = [
  MOON_SEAT_POSITION[0] + 1.5,
  // Lower it to sit on the moon surface
  MOON_SEAT_POSITION[1] - 0.3,
  MOON_SEAT_POSITION[2] + 0.5,
];

useGLTF.preload('/models/moon.glb');
useGLTF.preload('/models/jetpack/Jetpack.glb');
useFBX.preload('/models/idle.fbx');
useFBX.preload('/models/flying.fbx');
useFBX.preload('/models/landing.fbx');
useFBX.preload('/models/jump.fbx');
useFBX.preload('/models/sitting.fbx');

function App() {
  const [currentView, setCurrentView] = useState<'intro' | 'projects'>('intro');
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hopWaypoints, setHopWaypoints] = useState<[number, number, number][]>([[0, 0, 0]]);
  const [navApi, setNavApi] = useState<PlanetNavAPI | null>(null);

  // Tracks the real state of every drei/THREE loader (character, animations,
  // jetpack, moon, HDRI). Previously clicking "View Projects" before these
  // finished loading meant the mannequin's Suspense boundary rendered
  // nothing at all — the click registered instantly, but there was simply
  // nothing to see yet, which looked like an unexplained delay. Disabling
  // the button until this hits 100 makes the wait visible instead of silent.
  const { progress } = useProgress();
  const assetsReady = progress >= 100;

  // Opaque black wipe used ONLY for the intro <-> projects cinematic cut.
  // Starts fully transparent — this used to default to visible and blur/darken
  // the whole page permanently, which was the "everything is blurry" bug.
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fade in animation
    const timeline = gsap.timeline({ delay: 0.2 });
    timeline.from([
      { opacity: 0, y: 20 },
      { opacity: 0, y: -20 }
    ], {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.3,
      ease: 'power3.out'
    });
  }, []);

  const { phase: mannequinPhase, wrapperRef: mannequinWrapperRef, hopPositionRef, launch, returnHome } = useMannequinJourney({
    seatPosition: MOON_SEAT_POSITION,
  });

  const wipeTo = (view: 'intro' | 'projects') => {
    if (!transitionRef.current) {
      setCurrentView(view);
      return;
    }
    gsap.to(transitionRef.current, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        setCurrentView(view);
        gsap.to(transitionRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.2,
        });
      },
    });
  };

  // Clicking "View Projects" starts the mannequin hopping right away (still
  // on the intro screen); the screen only cuts to the moon once he's
  // actually airborne on the jetpack.
  const handleViewProjects = () => launch(() => wipeTo('projects'));
  const handleNavBack = () => returnHome(() => wipeTo('intro'));

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectPanel(true);
  };

  const handleClosePanel = () => {
    setShowProjectPanel(false);
    // Keep the project mounted briefly so the fade-out transition has
    // something to animate, then clear it.
    setTimeout(() => setSelectedProject(null), 400);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Canvas for 3D Scene */}
      <Canvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.22} color="#3730a3" />
        {/* Supplied night-sky HDRI: gives the glass cubes, suit, moon, and
            planets natural environment reflections without hiding the stars.
            Isolated in its own Suspense so this 70MB file loading in the
            background never blocks the cubes/scene from appearing instantly —
            this was the actual cause of the "delay before cubes show up" bug. */}
        <Suspense fallback={null}>
          <Environment files="/models/night-sky.exr" background={false} environmentIntensity={1.0} />
        </Suspense>

        {/* Cool key light from above */}
        <directionalLight position={[10, 12, 6]} intensity={0.8} color="#c7d2fe" />
        {/* Warm rim/fill from behind-left, purple accent to match the crystal cubes */}
        <pointLight position={[-14, 4, -8]} intensity={1.4} color="#a855f7" distance={40} />
        {/* Cyan fill from the right for depth */}
        <pointLight position={[12, -6, 4]} intensity={1} color="#22d3ee" distance={35} />

        <CameraRig view={currentView} />

        {currentView === 'intro' && <IntroScene onCubeTopsReady={setHopWaypoints} />}
        {currentView === 'projects' && (
          <Suspense fallback={null}>
            <ProjectSystems
              onProjectSelect={handleSelectProject}
              onBack={handleNavBack}
              onNavReady={setNavApi}
            />
          </Suspense>
        )}

        {/* Loading character files must never hide the cube/planet scene. */}
        <Suspense fallback={null}>
          <group ref={mannequinWrapperRef}>
            <Mannequin phase={mannequinPhase} hopPoints={hopWaypoints} hopPositionRef={hopPositionRef} />
          </group>
          <Jetpack position={JETPACK_DROP_POSITION} visible={mannequinPhase === 'landing' || mannequinPhase === 'seated'} />
        </Suspense>

        {/* Real bloom on emissive/bright surfaces (cube cores, planet glow,
            jetpack flame) instead of faked layered-transparency glow only.
            Requires: npm install @react-three/postprocessing */}
        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.15} darkness={0.6} />
        </EffectComposer>
      </Canvas>

      {/* Title / About Section - Only on Intro Screen */}
      {currentView === 'intro' && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none max-w-2xl px-6">
          <div className="mb-4">
            <p className="text-lg md:text-xl text-gray-400 mb-1">Hi, I'm</p>
            <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              Innocent
            </h1>
          </div>
          <div className="text-xl md:text-2xl text-gray-300 font-medium mb-4">
            Full Stack Developer &amp; Creative Developer
          </div>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-lg mx-auto">
            I build modern web applications, interactive experiences and digital
            solutions that solve real world problems — from healthcare platforms
            to playful 3D worlds like this one.
          </p>
        </div>
      )}

      {/* Action Buttons - Only on Intro Screen */}
      {currentView === 'intro' && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex flex-wrap justify-center gap-4">
          <button 
            onClick={handleViewProjects}
            disabled={!assetsReady}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {assetsReady ? 'View Projects' : `Loading… ${Math.round(progress)}%`}
          </button>
          <a
            href="mailto:hello@innocent.dev"
            className="px-8 py-3 border border-white/30 rounded-full text-lg font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
          >
            Contact Me
          </a>
          <a
            href="/cv.pdf"
            download
            className="px-8 py-3 border border-white/30 rounded-full text-lg font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
          >
            Download CV
          </a>
          <button 
            onClick={() => window.open('https://github.com/innocent', '_blank')}
            className="px-8 py-3 border border-white/30 rounded-full text-lg font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
          >
            GitHub
          </button>
          <button 
            onClick={() => window.open('https://linkedin.com/in/innocent', '_blank')}
            className="px-8 py-3 border border-white/30 rounded-full text-lg font-medium transition-all duration-300 hover:bg-white/10 hover:border-white/50"
          >
            LinkedIn
          </button>
        </div>
      )}

      {/* Drag-to-explore hint - Only on Intro Screen */}
      {currentView === 'intro' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-gray-500 text-xs tracking-widest uppercase pointer-events-none">
          <span>Drag to explore</span>
        </div>
      )}

      {/* Planet browse arrows - Only on Projects Screen */}
      {currentView === 'projects' && navApi && (
        <>
          <button
            onClick={navApi.prev}
            aria-label="Previous project"
            className="fixed left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 rounded-full backdrop-blur hover:bg-white/20 transition-colors text-xl"
          >
            ‹
          </button>
          <button
            onClick={navApi.next}
            aria-label="Next project"
            className="fixed right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 rounded-full backdrop-blur hover:bg-white/20 transition-colors text-xl"
          >
            ›
          </button>
        </>
      )}

      {/* Navigation */}
      <Navigation />

      {currentView === 'projects' && (
        <button
          onClick={handleNavBack}
          className="fixed top-8 left-8 z-20 px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium backdrop-blur hover:bg-white/20 transition-colors"
        >
          ← Back
        </button>
      )}

      {/* Project Panel Backdrop — hidden by default, only visible+interactive while a panel is open */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center transition-opacity duration-300 ${
          showProjectPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {selectedProject && (
          <ProjectCard 
            project={selectedProject} 
            onClose={handleClosePanel}
          />
        )}
      </div>

      {/* Cinematic screen wipe for intro <-> projects transitions */}
      <div
        ref={transitionRef}
        className="fixed inset-0 bg-black z-[60] pointer-events-none opacity-0"
      />
    </div>
  );
}

export default App;
