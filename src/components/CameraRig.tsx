import { useEffect } from 'react';
import { useCameraAnimation } from '../hooks/useCameraAnimation';

interface CameraRigProps {
  view: 'intro' | 'projects';
}

/**
 * Lives inside the <Canvas>. Drives the cinematic camera descent
 * between the intro void and the moon/project system.
 */
export default function CameraRig({ view }: CameraRigProps) {
  const { reset } = useCameraAnimation();

  useEffect(() => {
    if (view === 'intro') {
      reset([0, 0, 10], [0, 0, 0], 1.6);
    } else {
      // Zoomed in noticeably closer than before (was z=26) so the moon and
      // seated character read clearly instead of looking tiny and distant.
      reset([0, 1.5, 15], [0, -1, -2], 2.2);
    }
  }, [view, reset]);

  return null;
}
