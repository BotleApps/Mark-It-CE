import React from 'react';
import { Plus } from 'lucide-react';
import type { Space } from '../types';

interface SpaceSidebarProps {
  spaces: Space[];
  activeSpaceId: string;
  onSpaceSelect: (spaceId: string) => void;
  onCreateSpace: () => void;
  theme: 'light' | 'dark';
}

export function SpaceSidebar({
  spaces,
  activeSpaceId,
  onSpaceSelect,
  onCreateSpace,
  theme
}: SpaceSidebarProps) {
  return (
    <div className="flex-1 flex flex-col items-center py-4">
      {spaces.map((space) => (
        <button
          key={space.id}
          onClick={() => onSpaceSelect(space.id)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold mb-3 transition-all ${
            activeSpaceId === space.id
              ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
              : 'hover:scale-105'
          } ${theme === 'dark' ? 'ring-offset-gray-900' : 'ring-offset-white'}`}
          style={{ backgroundColor: space.color }}
          title={space.name}
        >
          <span className="text-white">
            {space.name.charAt(0).toUpperCase()}
          </span>
        </button>
      ))}

      <button
        onClick={onCreateSpace}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
          theme === 'dark'
            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
        title="Create new space"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
