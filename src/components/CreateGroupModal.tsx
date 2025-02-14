import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import type { BookmarkGroup } from '../types';

interface CreateGroupModalProps {
  onClose: () => void;
  onSave: (newGroup: Omit<BookmarkGroup, 'id'>) => void;
}

export function CreateGroupModal({ onClose, onSave }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.length <= 30) {
      onSave({
        name,
        color,
        bookmarks: [],
        isExpanded: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter group name"
              required
              maxLength={30}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Color
            </label>
            <ColorPicker selectedColor={color} onColorSelect={setColor} />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
