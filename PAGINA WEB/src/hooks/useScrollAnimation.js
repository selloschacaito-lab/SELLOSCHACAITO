import { useEffect } from 'react';

export const useScrollAnimation = (dependencyList = []) => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    // Pequeño timeout para asegurar que el DOM se haya pintado
    const timeoutId = setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in-up');
      elements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, dependencyList);
};
