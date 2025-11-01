import React from 'react';

const BlueprintIcon: React.FC = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-white"
    >
        <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M2 8.5L12 15.5L22 8.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M12 22V15.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M7 10.25L9.5 12L7 13.75" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M17 10.25L14.5 12L17 13.75" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
);

export default BlueprintIcon;