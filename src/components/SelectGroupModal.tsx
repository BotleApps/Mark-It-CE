import React from 'react';
import { X } from 'lucide-react';
import type { BookmarkGroup } from '../types';

interface SelectGroupModalProps {
  groups: BookmarkGroup[];
  onClose: () => void;
  onSelect: (groupId: string) => void;
  theme: 'light' | 'dark';
}

export function SelectGroupModal({ groups, onClose, onSelect, theme }: SelectGroupModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-[400px] p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Select Group
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

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelect(group.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: group.color }}
              />
              <span className="font-medium">{group.name}</span>
              <span className={`ml-auto text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {group.bookmarks.length} bookmarks
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}