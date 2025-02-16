import React, { useState, useRef, useEffect } from 'react';
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

  const [initialPosition, setInitialPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabRef.current && isDragging) {
      const rect = tabRef.current.getBoundingClientRect();
      setInitialPosition({ top: rect.top, left: rect.left, width: rect.width });
    } else if (!isDragging) {
      setInitialPosition(null); // Reset initialPosition when not dragging
    }
  }, [isDragging]);

  const style = isDragging && initialPosition ? {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: 100, // Increased zIndex for dragging
    isolation: 'isolate', // Create a new stacking context
    position: 'fixed', // Use fixed positioning during drag
    top: initialPosition.top,
    left: initialPosition.left,
    width: initialPosition.width, // Set the width
    maxWidth: '250px', // Set the max width
  } : { isolation: 'isolate' };

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          tabRef.current = node;
        }}
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
          <h3 className={`text-sm font-medium truncate ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {tab.title}
          </h3>
          <p className={`text-xs truncate ${
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
