import React from 'react';

const LoaderIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} animate-spin`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v3m0 12v3m9-9h-3m-12 0H3m16.5-6.5L19 7M5 19l1.5-1.5M19 19l-1.5-1.5M5 7l1.5 1.5"
    />
  </svg>
);

export default LoaderIcon;
