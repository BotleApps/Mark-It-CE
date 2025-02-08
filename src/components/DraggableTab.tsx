import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SelectGroupModal } from './SelectGroupModal';
import type { OpenTab, BookmarkGroup } from '../types';

interface DraggableTabProps {
  tab: OpenTab;
  groups: BookmarkGroup[];
  onBookmarkTab: (tab: OpenTab, groupId: string) => void;
  theme: 'light' | 'dark';
}

export function DraggableTab({ tab, groups, onBookmarkTab, theme }: DraggableTabProps) {
  const [showGroupSelect, setShowGroupSelect] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tab-${tab.id}`,
    data: { type: 'tab', tab },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={style}
        className={`group flex items-start justify-between p-3 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-lg border-2 ${
          isDragging 
            ? 'border-blue-500 shadow-lg' 
            : `border-dashed ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`
        } ${
          !isDragging && (theme === 'dark' ? 'hover:border-blue-500' : 'hover:border-blue-500')
        } transition-colors touch-none`}
      >
        <div className="flex-1 min-w-0 mr-4">
          <h3 className={`font-medium truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {tab.title}
          </h3>
          <p className={`text-sm truncate ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {tab.url}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowGroupSelect(true);
          }}
          className={`p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/20'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Add to bookmarks"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showGroupSelect && (
        <SelectGroupModal
          groups={groups}
          onClose={() => setShowGroupSelect(false)}
          onSelect={(groupId) => {
            onBookmarkTab(tab, groupId);
            setShowGroupSelect(false);
          }}
          theme={theme}
        />
      )}
    </>
  );
}
