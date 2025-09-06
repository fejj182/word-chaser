'use client';

import React, { useState } from 'react';
import { CreateRoomParams, RoomSettings } from '@/features/room-management/types/room';
import { GridSizeSelector } from '@/features/game-play/components/GridSizeSelector';

interface CreateRoomUIProps {
  onSubmit: (params: CreateRoomParams, alias: string) => Promise<void>;
  isLoading: boolean; //TODO: remove this prop
  error?: string | null;
  initialAlias?: string;
}
const CreateRoomUI: React.FC<CreateRoomUIProps> = ({ onSubmit, isLoading, error = null, initialAlias }) => {
  const [formData, setFormData] = useState<CreateRoomParams>({
    maxPlayers: 4,
    settings: {
      roundDuration: 60,
      maxRounds: 5,
      gridSize: 'medium',
    },
  });
  const [alias, setAlias] = useState<string>(initialAlias || '');

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
    if (!alias.trim()) {
      return;
    }
    await onSubmit(formData, alias.trim());
  };

  return (
    <div className="card card--form">
      <h2 className="text--card-title">
        Create a New Room
      </h2>
      
      <form onSubmit={handleSubmit} className="spacing--form">
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}
      
      {/* Alias */}
      <div>
        <label htmlFor="alias" className="form-label">
          Alias
        </label>
        <input
          type="text"
          id="alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="form-input"
          placeholder="Choose a name to play as…"
          required
          minLength={2}
          maxLength={20}
          disabled={isLoading}
        />
      </div>

      

      {/* Max Players */}
      <div>
        <label htmlFor="maxPlayers" className="form-label">
          Maximum Players
        </label>
        <select
          id="maxPlayers"
          data-testid="max-players-select"
          value={formData.maxPlayers}
          onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
          className="form-input"
          disabled={isLoading}
        >
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
          <option value={6}>6 Players</option>
          <option value={8}>8 Players</option>
        </select>
      </div>

      {/* Grid Size */}
      <GridSizeSelector
        value={formData.settings.gridSize}
        onChange={(gridSize) => handleSettingsChange('gridSize', gridSize)}
        disabled={isLoading}
      />

      {/* Game Settings */}
      <div className="section--divider-settings">
        <h3 className="text--section-title">Game Settings</h3>
        
        <div className="spacing--settings">
          {/* Round Duration */}
          <div>
            <label htmlFor="roundDuration" className="form-label">
              Round Duration (seconds)
            </label>
            <select
              id="roundDuration"
              value={formData.settings.roundDuration}
              onChange={(e) => handleSettingsChange('roundDuration', parseInt(e.target.value))}
              className="form-input"
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
            <label htmlFor="maxRounds" className="form-label">
              Number of Rounds
            </label>
            <select
              id="maxRounds"
              value={formData.settings.maxRounds}
              onChange={(e) => handleSettingsChange('maxRounds', parseInt(e.target.value))}
              className="form-input"
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
        disabled={isLoading || !alias.trim()}
        className="btn btn--primary btn--full btn--medium btn--disabled"
      >
        Create Room
      </button>
      </form>
    </div>
  );
};

export default CreateRoomUI;
