import { useEffect } from 'react';

export const useAccordion = hash => {
  const toggleChildrenClass = parent => {
    Array.from(parent.getElementsByTagName('p')).map(p =>
      p.classList.toggle('show')
    );

    Array.from(parent.getElementsByTagName('ul')).map(p =>
      p.classList.toggle('show')
    );
  };
  useEffect(() => {
    if (hash) {
      const parent = document.getElementById(hash).parentNode;

      document.getElementById(hash).classList.toggle('open');
      toggleChildrenClass(parent);
    }
    const toggleClasses = e => {
      if (e.target.localName !== 'h2') return;
      history.pushState({}, '', e.target.id);
      history.scrollRestoration = 'manual';
      const parent = e.target.parentNode;

      e.target.classList.toggle('open');
      toggleChildrenClass(parent);
    };

    document.addEventListener('click', toggleClasses);

    return () => document.removeEventListener('click', toggleClasses);
  }, [hash]);
};
