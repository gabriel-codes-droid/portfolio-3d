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
      reset([0, 0, 8], [0, 0, 0], 1.6);
    } else {
      // Zoomed in a bit further per request (was z=15)
      reset([0, 1.3, 12], [0, -1, -2], 2.2);
    }
  }, [view, reset]);

  return null;
}
