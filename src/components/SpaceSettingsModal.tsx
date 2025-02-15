import React, { useState } from 'react';
import { X, Trash } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import type { Space } from '../types';

interface SpaceSettingsModalProps {
  space: Space;
  onClose: () => void;
  onSave: (updatedSpace: Space) => void;
  onDelete: () => void;
  theme: 'light' | 'dark';
  spaces: Space[] | undefined;
}

export function SpaceSettingsModal({ space, onClose, onSave, onDelete, theme, spaces }: SpaceSettingsModalProps) {
  const [name, setName] = useState(space.name);
  const [color, setColor] = useState(space.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.length <= 30) {
      onSave({
        ...space,
        name,
        color,
      });
    }
  };

  const handleDelete = () => {
    //close the modal first
    onClose();
    if (window.confirm('Are you sure you want to delete this space and all its groups and bookmarks?')) {
      onDelete();
    }
  };

  const isDeleteDisabled = spaces?.length <= 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-[400px] p-6 rounded-lg relative ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Space Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Space Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'border-gray-300 text-gray-900'
              }`}
              placeholder="Enter space name"
              maxLength={30}
              required
            />
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Space Color
            </label>
            <ColorPicker selectedColor={color} onColorSelect={setColor} />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleteDisabled}
          className={`absolute bottom-4 left-4 p-2 rounded-full transition-colors ${
            isDeleteDisabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          <Trash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
