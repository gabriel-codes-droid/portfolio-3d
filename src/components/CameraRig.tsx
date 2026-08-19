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
      reset([0, 3, 26], [0, -4, 0], 2.4);
    }
  }, [view, reset]);

  return null;
}
