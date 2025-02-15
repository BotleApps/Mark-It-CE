import React, { useState } from 'react';
import { X, Trash } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import type { BookmarkGroup } from '../types';

interface GroupSettingsModalProps {
  group: BookmarkGroup;
  onClose: () => void;
  onSave: (updatedGroup: BookmarkGroup) => void;
  onDelete: () => void;
  groups: BookmarkGroup[];
}

export function GroupSettingsModal({ group, onClose, onSave, onDelete, groups }: GroupSettingsModalProps) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.length <= 30) {
      onSave({
        ...group,
        name,
        color,
      });
    }
  };

  const isDeleteDisabled = groups?.length <= 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[400px] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Group Settings</h2>
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
              maxLength={30}
              required
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
              Save Changes
            </button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this group and all its bookmarks?')) {
              onDelete();
            }
          }}
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
