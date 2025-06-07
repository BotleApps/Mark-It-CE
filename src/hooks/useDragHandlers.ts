import { useCallback } from 'react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useDragContext } from '../contexts/useDragContext'; // Updated import path
import type { Space, OpenTab } from '../types';

export function useDragHandlers(
  activeSpace: Space, 
  handleBookmarkTab: (tab: OpenTab) => Promise<{ title: string; url: string; createdAt: string; }>
) {
  const {
    setActiveTab,
    setActiveGroup,
  } = useDragContext();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    
    if (activeData?.type === 'tab') {
      setActiveTab(activeData.tab);
    }
  }, [setActiveTab]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === 'tab' && overData?.type === 'group') {
      setActiveGroup(over.id as string);
    }
  }, [setActiveGroup]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTab(null);
      setActiveGroup(null);
      return;
    }

    try {
      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type === 'tab' && overData?.type === 'group') {
        // The groupId (over.id) will need to be handled by the calling component
        // that uses the result of handleBookmarkTab along with this groupId.
        await handleBookmarkTab(activeData.tab);
      }
    } catch (error) {
      console.error('Error handling drag end:', error);
    } finally {
      setActiveTab(null);
      setActiveGroup(null);
    }
  }, [handleBookmarkTab, setActiveTab, setActiveGroup]);

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
