'use client';

import React from 'react';

interface RoomMenuUIProps {
  onCreate: () => void;
  onJoin: () => void;
}

const RoomMenuUI: React.FC<RoomMenuUIProps> = ({ onCreate, onJoin }) => {
  return (
    <div className="card card--menu">
      <div className="spacing--menu">
        <button
          onClick={onCreate}
          className="btn btn--primary btn--full btn--large"
        >
          Create a New Room
        </button>
        
        <button
          onClick={onJoin}
          className="btn btn--secondary btn--full btn--large"
        >
          Join Existing Room
        </button>
      </div>
    </div>
  );
};

export default RoomMenuUI;



