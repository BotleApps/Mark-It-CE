import React from 'react';
import { DraggableTab } from './DraggableTab';
import type { OpenTab, BookmarkGroup } from '../types';

interface OpenTabsListProps {
  tabs: OpenTab[];
  groups: BookmarkGroup[];
  onBookmarkTab: (tab: OpenTab, groupId: string) => void;
  theme: 'light' | 'dark';
}

export function OpenTabsList({ tabs, groups, onBookmarkTab, theme }: OpenTabsListProps) {
  return (
    <div className="space-y-2">
      {tabs.map((tab) => (
        <DraggableTab 
          key={tab.id} 
          tab={tab} 
          groups={groups}
          onBookmarkTab={onBookmarkTab}
          theme={theme}
        />
      ))}
    </div>
  );
}