import React from 'react';

const OpenAIIcon: React.FC<{className?: string}> = ({className}) => (
    <svg 
        className={className}
        viewBox="0 0 41 41" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M38.2333 19.9958C38.2333 18.2958 37.9667 16.6333 37.45 15.05L20.5 3.83331L3.55 15.05C1.55 18.0666 1.55 21.9333 3.55 24.95L10.3333 33.05C11.3333 34.3666 12.8333 35.25 14.5 35.45V35.45L20.5 31.8333L26.5 35.45V35.45C28.1667 35.25 29.6667 34.3666 30.6667 33.05L37.45 24.95C37.9667 23.3666 38.2333 21.7041 38.2333 19.9958Z" fill="#FFFFFF"/>
    </svg>
);

export default OpenAIIcon;