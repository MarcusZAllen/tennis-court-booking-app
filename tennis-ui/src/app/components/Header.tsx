import React from 'react';

const Header: React.FC = () => (
  <header className="w-full bg-white border-b border-gray-200 shadow-sm">
    <div className="w-full max-w-7xl mx-auto flex flex-row items-center justify-between px-6 py-4">
      <div className="text-xl font-bold tracking-tight text-gray-900">
        I WANT TO PLAY TENNIS
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for actions/profile */}
        <button className="bg-black text-white rounded px-4 py-2 font-semibold">Share</button>
        <div className="w-10 h-10 rounded-full bg-gray-300" />
      </div>
    </div>
  </header>
);

export default Header; 