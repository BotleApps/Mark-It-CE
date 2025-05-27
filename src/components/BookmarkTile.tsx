import React from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Bookmark, LinkTarget } from '../types';

interface BookmarkTileProps {
  bookmark: Bookmark;
  groupColor: string;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onMove: (direction: 'left' | 'right') => void;
  isFirst: boolean;
  isLast: boolean;
  theme: 'light' | 'dark';
  linkTarget: LinkTarget;
}

export function BookmarkTile({
  bookmark,
  groupColor,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast,
  theme,
  linkTarget
}: BookmarkTileProps) {
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleTileClick = (e: React.MouseEvent) => {
    // Ensure the click is on the tile itself or within the bookmark content
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.bookmark-content')) {
      window.open(bookmark.url, linkTarget, 'noopener,noreferrer');
    }
  };

  return (
    <div
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: groupColor,
        backgroundColor: hexToRgba(groupColor, 0.1),
      }}
      className={`group p-1.5 rounded-lg border h-full cursor-pointer ${
        theme === 'dark'
          ? 'border-gray-700 hover:shadow-md'
          : 'border-gray-200 hover:shadow-md'
      }`}
      onClick={handleTileClick}
    >
      <div className="flex flex-col h-full">
        {/* Bookmark Content Area */}
        <div className="flex-1 min-h-0 bookmark-content">
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

        {/* Actions Container */}
        <div
          className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between"
          onClick={handleTileClick}
        >
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove('left');
              }}
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
              onClick={(e) => {
                e.stopPropagation();
                onMove('right');
              }}
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
