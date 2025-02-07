import React, { createContext, useContext, useState } from 'react';
import type { OpenTab, Bookmark } from '../types';

interface DragContextType {
  activeTab: OpenTab | null;
  setActiveTab: (tab: OpenTab | null) => void;
  activeDragItem: any;
  setActiveDragItem: (item: any) => void;
  activeGroup: string | null;
  setActiveGroup: (groupId: string | null) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<OpenTab | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <DragContext.Provider value={{
      activeTab,
      setActiveTab,
      activeDragItem,
      setActiveDragItem,
      activeGroup,
      setActiveGroup,
    }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDragContext() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
}