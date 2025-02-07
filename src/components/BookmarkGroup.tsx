import React from 'react';
import { Trash2, Settings } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { BookmarkTile } from './BookmarkTile';
import type { BookmarkGroup as BookmarkGroupType, Bookmark } from '../types';
import toast from 'react-hot-toast';

interface BookmarkGroupProps {
  group: BookmarkGroupType;
  onToggleExpand: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onEditGroup: (group: BookmarkGroupType) => void;
  onDeleteGroup: (groupId: string) => void;
  theme: 'light' | 'dark';
}

export function BookmarkGroup({
  group,
  onToggleExpand,
  onEditBookmark,
  onDeleteBookmark,
  onEditGroup,
  onDeleteGroup,
  theme,
}: BookmarkGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { type: 'group', group },
  });

  // Convert hex to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleMoveBookmark = (index: number, direction: 'left' | 'right') => {
    const newBookmarks = [...group.bookmarks];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newBookmarks.length) {
      // Create a new array with the updated order
      const reorderedBookmarks = [...newBookmarks];
      
      // Swap the bookmarks
      [reorderedBookmarks[index], reorderedBookmarks[newIndex]] = 
      [reorderedBookmarks[newIndex], reorderedBookmarks[index]];
      
      // Update the group with the new bookmark order
      onEditGroup({
        ...group,
        bookmarks: reorderedBookmarks
      });

      toast.success(`Bookmark moved ${direction}`, {
        style: {
          background: theme === 'dark' ? '#374151' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000',
        },
      });
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-lg border transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } ${
        isOver 
          ? theme === 'dark'
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
            : 'border-blue-500 bg-blue-50 scale-[1.02]'
          : ''
      }`}
      style={{
        transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease'
      }}
    >
      <div 
        className="flex items-center justify-between p-3 rounded-t-lg"
        style={{
          backgroundColor: hexToRgba(group.color, 0.2)
        }}
      >
        <h3 className={`text-lg font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {group.name}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditGroup(group)}
            className={`p-1.5 rounded-full hover:bg-white/10 ${
              theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
            }`}
            title="Group settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className={`p-1.5 rounded-full hover:bg-white/10 ${
              theme === 'dark' ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
            }`}
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-3 grid auto-rows-[100px] grid-cols-[repeat(auto-fill,250px)] gap-3">
        <div className="contents">
        {group.bookmarks.map((bookmark, index) => (
          <BookmarkTile
            key={bookmark.id}
            bookmark={bookmark}
            groupColor={group.color}
            onEdit={onEditBookmark}
            onDelete={onDeleteBookmark}
            onMove={(direction) => handleMoveBookmark(index, direction)}
            isFirst={index === 0}
            isLast={index === group.bookmarks.length - 1}
            theme={theme}
          />
        ))}
        </div>
      </div>
    </div>
  );
}