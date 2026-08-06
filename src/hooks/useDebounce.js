import { useState, useEffect } from 'react';

/**
 * Hook to debounce a value
 * Useful for search inputs to avoid excessive re-renders
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {any} - The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 *
 * @param {Function} callback - The callback to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependency array for useCallback
 * @returns {Function} - The debounced callback
 */
export function useDebouncedCallback(callback, delay = 300, dependencies = []) {
  const [timeoutId, setTimeoutId] = useState(null);

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}
