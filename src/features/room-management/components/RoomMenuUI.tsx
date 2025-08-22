'use client';

import React from 'react';

interface RoomMenuUIProps {
  onCreate: () => void;
  onJoin: () => void;
}

const RoomMenuUI: React.FC<RoomMenuUIProps> = ({ onCreate, onJoin }) => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        <button
          onClick={onCreate}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Create a New Room
        </button>
        
        <button
          onClick={onJoin}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Join Existing Room
        </button>
      </div>
    </div>
  );
};

export default RoomMenuUI;



