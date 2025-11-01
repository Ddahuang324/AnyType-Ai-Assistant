
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center text-white bg-black">
      <div 
        className="absolute inset-0 ken-burns opacity-40"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')" }}
      ></div>
      <div className="relative z-10 flex flex-col items-center text-center p-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">Anytype AI Hub</h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Your Integrated Knowledge & Intelligence Hub.
        </p>
        <button
          onClick={onEnter}
          className="bg-white text-[#222222] font-semibold py-3 px-8 rounded-md
                     transform transition-all duration-300 ease-in-out
                     hover:bg-[#005F73] hover:text-white hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
