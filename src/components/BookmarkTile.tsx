import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Bookmark } from '../types';

interface BookmarkTileProps {
  bookmark: Bookmark;
  groupColor: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onMove: (direction: 'left' | 'right') => void;
  isFirst: boolean;
  isLast: boolean;
  theme: 'light' | 'dark';
}

export function BookmarkTile({
  bookmark,
  groupColor,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast,
  theme
}: BookmarkTileProps) {
  // Convert hex to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleTileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleMove = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    onMove(direction);
  };

  return (
    <div
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: groupColor,
        backgroundColor: hexToRgba(groupColor, 0.1),
      }}
      className={`group p-1.5 rounded-lg border h-full flex flex-col ${
        theme === 'dark'
          ? 'border-gray-700 hover:shadow-md'
          : 'border-gray-200 hover:shadow-md'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        <div
          className="flex-1 min-h-0 cursor-pointer"
          onClick={handleTileClick}
        >
          <h4 className={`text-sm font-medium truncate mb-0.5 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {bookmark.title}
          </h4>
          <p className={`text-xs overflow-hidden text-ellipsis max-h-[2.5em] break-all group-hover:max-h-[1.25em] transition-all duration-300 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {bookmark.url}
          </p>
        </div>

        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => handleMove(e, 'left')}
              disabled={isFirst}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 disabled:text-gray-600 disabled:hover:bg-transparent'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:hover:bg-transparent'
              }`}
              title="Move left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleMove(e, 'right')}
              disabled={isLast}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 disabled:text-gray-600 disabled:hover:bg-transparent'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:hover:bg-transparent'
              }`}
              title="Move right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bookmark);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/20'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Edit bookmark"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title="Delete bookmark"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
