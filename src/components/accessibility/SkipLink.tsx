import React from 'react';

const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-br-md transition-all"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;
