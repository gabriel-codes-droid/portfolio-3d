import { useCallback, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Vector3 } from 'three';
import type { Group } from 'three';
import type { MannequinPhase } from '../components/Mannequin';

interface UseMannequinJourneyOptions {
  /** World position of the moon's seated viewing area, e.g. [0, -1.5, 3] */
  seatPosition: [number, number, number];
}

/**
 * Orchestrates the mannequin's journey. Starts idle (standing still) until
 * `launch()` is called — then it hops across the cube field, ignites its
 * jetpack immediately after the hop, and flies down to the moon's seat.
 * The whole jump-to-flight sequence takes ~950ms instead of ~4s.
 *
 * `returnHome()` reverses the trip. Both accept a callback fired at the
 * cinematic mid-flight moment, so the caller can cut the screen/scene
 * exactly when the mannequin is airborne rather than before he's moved.
 */
export function useMannequinJourney({ seatPosition }: UseMannequinJourneyOptions) {
  const [phase, setPhase] = useState<MannequinPhase>('idle');
  const wrapperRef = useRef<Group>(null);
  // The visual model moves between cube tops locally. Keep its latest world
  // position so the wrapper can take over seamlessly when flight begins.
  const hopPositionRef = useRef(new Vector3());
  const hopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Launch: hop → jetpack ignite → slow fly → land on moon ──────────
  const launch = useCallback(
    (onMidFlight?: () => void) => {
      if (hopTimeout.current) clearTimeout(hopTimeout.current);
      setPhase('hopping');

      // Let one full hop cycle actually play before launching. This MUST
      // be >= Mannequin.tsx's HOP_DURATION (now 3.0s, per request) — 3100ms
      // lets exactly one complete, readable hop land before the jetpack
      // ignites.
      hopTimeout.current = setTimeout(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) {
          onMidFlight?.();
          setPhase('seated');
          return;
        }

        wrapper.position.copy(hopPositionRef.current);

        const tl = gsap.timeline({ onComplete: () => setPhase('seated') });

        // Hop up with jetpack ignition
        tl.to(wrapper.position, {
          y: wrapper.position.y + 2.2,
          x: wrapper.position.x + 2.8,
          z: wrapper.position.z + 1.2,
          duration: 0.28,
          ease: 'power2.out',
          onStart: () => setPhase('launching'),
        });
        // Land the hop
        tl.to(wrapper.position, {
          y: wrapper.position.y - 2.2,
          x: wrapper.position.x + 5.6,
          z: wrapper.position.z + 2.4,
          duration: 0.28,
          ease: 'power2.in',
        });
        // Jetpack ignites — mid-flight callback (this is where screen cuts)
        tl.call(() => {
          setPhase('flying');
          onMidFlight?.();
        });
        // Slow, visible fly up toward the moon — lengthened further per
        // request so the flying pose + jetpack flames are unmistakably clear.
        tl.to(wrapper.position, {
          y: seatPosition[1] + 14,
          x: seatPosition[0] + 1.5,
          z: seatPosition[2] + 18,
          duration: 2.6,
          ease: 'power1.inOut',
        });
        // Descend onto the seat
        tl.to(wrapper.position, {
          x: seatPosition[0],
          y: seatPosition[1],
          z: seatPosition[2],
          duration: 2.2,
          ease: 'power3.out',
        });
        // Jetpack detaches, play landing animation, then settle
        tl.call(() => {
          setPhase('landing');
        });
        // Settle rotation
        tl.to(wrapper.rotation, {
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.4');
      }, 3100);
    },
    [seatPosition]
  );

  // ── Return Home: launch → fly back → land on cubes ──────────────────
  const returnHome = useCallback(
    (onMidFlight?: () => void) => {
      if (hopTimeout.current) clearTimeout(hopTimeout.current);
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        onMidFlight?.();
        setPhase('idle');
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setPhase('hopping');
          setTimeout(() => setPhase('idle'), 3100);
        },
      });

      // Jetpack reattaches + take off
      tl.to(wrapper.position, {
        z: seatPosition[2] + 15,
        y: seatPosition[1] + 3,
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => setPhase('launching'),
      });
      // Mid-flight callback (screen cuts here)
      tl.call(() => {
        setPhase('flying');
        onMidFlight?.();
      });
      // Slow, visible fly back — matches the launch's lengthened duration
      tl.to(wrapper.position, {
        x: 0,
        y: 2,
        z: -2,
        duration: 2.6,
        ease: 'power1.inOut',
      });
      // Jet dive back to cube tops
      tl.to(wrapper.position, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.8,
        ease: 'power3.in',
      });
      // Land with a hop, then let one full hop cycle read before settling
      // back to idle (same 2000ms reasoning as the launch sequence above).
      tl.call(() => {
        setPhase('landing');
      });
      tl.to(wrapper.rotation, {
        x: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, '+=0.1');
    },
    [seatPosition]
  );

  return { phase, wrapperRef, hopPositionRef, launch, returnHome };
}
