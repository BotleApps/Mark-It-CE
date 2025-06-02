import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Bookmark } from '../types';

interface BookmarkEditModalProps {
  bookmark: Bookmark;
  onClose: () => void;
  onSave: (updatedBookmark: Bookmark) => void;
  theme: 'light' | 'dark';
}

export function BookmarkEditModal({ bookmark, onClose, onSave, theme }: BookmarkEditModalProps) {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [error, setError] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleSubmit = (_e: React.SyntheticEvent) => { // Changed e to _e and type
    _e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!url.trim()) {
      setError('URL is required.');
      return;
    }
    try {
      new URL(url);
      onSave({
        ...bookmark,
        title,
        url,
      });
      setError('');
      onClose();
    } catch (e) {
      setError('Invalid URL.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e); // Removed 'as any'
    }
  };

  const darkTheme = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-lg w-[500px] p-6 ${darkTheme ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Edit Bookmark
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${darkTheme ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
              required
              ref={titleInputRef}
            />
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 text-gray-900'}`}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${darkTheme ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
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
      </div>
    </div>
  );
}
