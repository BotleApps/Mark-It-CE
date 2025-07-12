import React, { useState } from 'react'; // Removed createContext, useContext
import type { OpenTab, Bookmark } from '../types'; // Bookmark may be unused if DragContextType is fully imported
import { DragContext, type DragContextType } from './DragContextObject'; // Import DragContext and its type

// DragContextType is now imported from DragContextObject.ts
// const DragContext object is now imported from DragContextObject.ts

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<OpenTab | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<OpenTab | Bookmark | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // Ensure the value provided to context matches DragContextType
  const contextValue: DragContextType = {
    activeTab,
    setActiveTab,
    activeDragItem,
    setActiveDragItem,
    activeGroup,
    setActiveGroup,
  };

  return (
    <DragContext.Provider value={contextValue}>
      {children}
    </DragContext.Provider>
  );
}
// useDragContext function is now in useDragContext.ts
