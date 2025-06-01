import { useContext } from 'react';
import { DragContext, type DragContextType } from './DragContextObject'; // Updated import path
// Removed local DragContextType definition and its OpenTab, Bookmark imports as DragContextType is now imported.
// Note: OpenTab and Bookmark might still be needed if used elsewhere, but not for DragContextType here.
// The DragContextType from './DragContext' already uses OpenTab and Bookmark from '../types'.


export function useDragContext() {
  const context = useContext<DragContextType | undefined>(DragContext); // Explicitly type useContext with imported DragContextType
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  return context;
}
