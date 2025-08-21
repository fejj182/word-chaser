'use client';

import React, { useState } from 'react';
import { CreateRoomParams, RoomSettings } from '@/features/shared/types/room';

interface CreateRoomFormProps {
  onSubmit: (params: CreateRoomParams) => Promise<void>;
  isLoading: boolean;
}

const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateRoomParams>({
    name: '',
    maxPlayers: 4,
    settings: {
      roundDuration: 60,
      maxRounds: 5,
    },
  });

  const handleInputChange = (field: keyof CreateRoomParams, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingsChange = (field: keyof RoomSettings, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Room Name */}
      <div>
        <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
          Room Name
        </label>
        <input
          type="text"
          id="roomName"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter room name..."
          required
          disabled={isLoading}
        />
      </div>

      {/* Max Players */}
      <div>
        <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Players
        </label>
        <select
          id="maxPlayers"
          value={formData.maxPlayers}
          onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
          <option value={6}>6 Players</option>
          <option value={8}>8 Players</option>
        </select>
      </div>

      {/* Game Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Game Settings</h3>
        
        <div className="space-y-4">
          {/* Round Duration */}
          <div>
            <label htmlFor="roundDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Round Duration (seconds)
            </label>
            <select
              id="roundDuration"
              value={formData.settings.roundDuration}
              onChange={(e) => handleSettingsChange('roundDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={30}>30 seconds</option>
              <option value={45}>45 seconds</option>
              <option value={60}>1 minute</option>
              <option value={90}>1.5 minutes</option>
              <option value={120}>2 minutes</option>
            </select>
          </div>

          {/* Max Rounds */}
          <div>
            <label htmlFor="maxRounds" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds
            </label>
            <select
              id="maxRounds"
              value={formData.settings.maxRounds}
              onChange={(e) => handleSettingsChange('maxRounds', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value={3}>3 rounds</option>
              <option value={5}>5 rounds</option>
              <option value={7}>7 rounds</option>
              <option value={10}>10 rounds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formData.name.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Create Room
      </button>
    </form>
  );
};

export default CreateRoomForm;
