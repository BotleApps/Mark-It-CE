import { useCallback } from 'react';
import { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { useDragContext } from '../contexts/DragContext';
import type { Space, OpenTab } from '../types';

export function useDragHandlers(
  activeSpace: Space, 
  handleBookmarkTab: (tab: OpenTab, groupId: string) => Promise<void>
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
        await handleBookmarkTab(activeData.tab, over.id as string);
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
