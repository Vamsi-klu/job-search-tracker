import { useState, useEffect } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Respects system-level accessibility settings
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation config that respects reduced motion preference
 * @param {Object} normalConfig - Normal animation configuration
 * @param {Object} reducedConfig - Reduced motion configuration
 * @returns {Object} - Appropriate animation config
 */
export function useMotionConfig(normalConfig, reducedConfig = {}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      ...normalConfig,
      ...reducedConfig,
      transition: {
        duration: 0.01, // Nearly instant
        ...reducedConfig.transition
      }
    };
  }

  return normalConfig;
}
