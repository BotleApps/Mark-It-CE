import { createContext } from 'react';
import type { OpenTab, Bookmark } from '../types'; // Keep types needed for DragContextType

export interface DragContextType {
  activeTab: OpenTab | null;
  setActiveTab: (tab: OpenTab | null) => void;
  activeDragItem: OpenTab | Bookmark | null;
  setActiveDragItem: (item: OpenTab | Bookmark | null) => void;
  activeGroup: string | null;
  setActiveGroup: (groupId: string | null) => void;
}

export const DragContext = createContext<DragContextType | undefined>(undefined);
