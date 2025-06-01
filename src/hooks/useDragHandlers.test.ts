import { act, renderHook } from '@testing-library/react';
import { useDragHandlers } from './useDragHandlers';
import type { Space, OpenTab, Bookmark } from '../types';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';

// Mock useDragContext
const mockSetActiveTab = jest.fn();
const mockSetActiveGroup = jest.fn();
jest.mock('../contexts/DragContext', () => ({
  useDragContext: () => ({
    setActiveTab: mockSetActiveTab,
    setActiveGroup: mockSetActiveGroup,
    // Provide other context values if the hook uses them, e.g., activeTab, activeGroup for reading
    activeTab: null,
    activeGroup: null,
  }),
}));

// Mock data
const mockActiveSpace: Space = { // Not directly used by the hook's current logic but good for context
  id: 'space1',
  name: 'Test Space',
  color: '#fff',
  groups: [
    { id: 'group1', name: 'Group 1', color: '#eee', bookmarks: [{id: 'bm1', title: 'BM1', url:'url1', createdAt:''}], isExpanded: true },
  ],
};

const mockOpenTab: OpenTab = { id: 123, title: 'Test Tab', url: 'https://tab.example.com' };
// mockBookmark is not used by the current hook implementation for drag start/over/end directly

describe('useDragHandlers Hook', () => {
  let mockOnBookmarkOpenTab: jest.Mock;
  // mockOnMoveBookmarkInGroup is removed as the hook doesn't use it.

  beforeEach(() => {
    jest.clearAllMocks(); // Clears mockSetActiveTab, mockSetActiveGroup, and mockOnBookmarkOpenTab
    mockOnBookmarkOpenTab = jest.fn();
  });

  // The hook doesn't take handleMoveBookmarkInGroup, so removed from props
  const getHook = () => renderHook(() => useDragHandlers(
    mockActiveSpace, // activeSpace is not used in the current implementation
    mockOnBookmarkOpenTab,
  ));

  // --- handleDragStart ---
  describe('handleDragStart', () => {
    test("should call setActiveTab when dragging a 'tab'", () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(mockSetActiveTab).toHaveBeenCalledWith(mockOpenTab);
      expect(mockSetActiveGroup).not.toHaveBeenCalled(); // Should not be called on start
    });

    test("should not call setActiveTab when dragging other types (e.g. 'bookmark')", () => {
      const { result } = getHook();
      const mockBookmarkItem: Bookmark = {id: 'b1', title: 'b', url: 'u', createdAt: 'c'};
      const event = { // Simulating a bookmark drag start as per previous assumptions
        active: { id: 'bookmark-b1', data: { current: { type: 'bookmark', item: mockBookmarkItem, sourceGroup: 'group1' } } },
      } as DragStartEvent;

      act(() => result.current.handleDragStart(event));

      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    test("should do nothing if active.data.current is missing", () => {
      const { result } = getHook();
      const event = { active: { id: 'unknown' } } as DragStartEvent; // No data.current
      act(() => result.current.handleDragStart(event));
      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    test("should do nothing if active.data.current.type is not 'tab'", () => {
      const { result } = getHook();
      const event = { active: { id: 'item-1', data: { current: { type: 'some-other-type' } } } } as DragStartEvent;
      act(() => result.current.handleDragStart(event));
      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });
  });

  // --- handleDragOver ---
  describe('handleDragOver', () => {
    test("should call setActiveGroup when a 'tab' is dragged over a 'group'", () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragOverEvent;

      act(() => {
        result.current.handleDragOver(event);
      });
      expect(mockSetActiveGroup).toHaveBeenCalledWith('group1');
    });

    test("should not call setActiveGroup if active item is not 'tab'", () => {
      const { result } = getHook();
      const event = {
        active: { id: 'bm-1', data: { current: { type: 'bookmark' } } }, // Not a tab
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragOverEvent;
      act(() => result.current.handleDragOver(event));
      expect(mockSetActiveGroup).not.toHaveBeenCalled();
    });

    test("should not call setActiveGroup if over item is not 'group'", () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'some-id', data: { current: { type: 'not-a-group' } } }, // Not a group
      } as DragOverEvent;
      act(() => result.current.handleDragOver(event));
      expect(mockSetActiveGroup).not.toHaveBeenCalled();
    });

    test("should not call setActiveGroup if over is null", () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: null,
      } as DragOverEvent;
      act(() => result.current.handleDragOver(event));
      expect(mockSetActiveGroup).not.toHaveBeenCalled();
    });

    test("should not call setActiveGroup if active.data.current or over.data.current is missing", () => {
      const { result } = getHook();
      const eventNoActiveData = {
        active: { id: 'tab-123' }, // No data.current
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragOverEvent;
      act(() => result.current.handleDragOver(eventNoActiveData));
      expect(mockSetActiveGroup).not.toHaveBeenCalled();

      jest.clearAllMocks(); // Clear for next sub-test

      const eventNoOverData = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'group1' }, // No data.current
      } as DragOverEvent;
      act(() => result.current.handleDragOver(eventNoOverData));
      expect(mockSetActiveGroup).not.toHaveBeenCalled();
    });
  });

  // --- handleDragEnd ---
  describe('handleDragEnd', () => {
    test("should call onBookmarkOpenTab when a 'tab' is dropped on a 'group'", async () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragEndEvent;

      await act(async () => {
        await result.current.handleDragEnd(event);
      });

      expect(mockOnBookmarkOpenTab).toHaveBeenCalledWith(mockOpenTab, 'group1');
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);
    });

    test("should not call onBookmarkOpenTab if 'over' is null", async () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: null,
      } as DragEndEvent;

      await act(async () => {
        await result.current.handleDragEnd(event);
      });

      expect(mockOnBookmarkOpenTab).not.toHaveBeenCalled();
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);
    });

    test("should not call onBookmarkOpenTab if active item is not 'tab'", async () => {
      const { result } = getHook();
      const event = {
        active: { id: 'item-1', data: { current: { type: 'not-a-tab' } } },
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragEndEvent;

      await act(async () => { await result.current.handleDragEnd(event); });

      expect(mockOnBookmarkOpenTab).not.toHaveBeenCalled();
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);
    });

    test("should not call onBookmarkOpenTab if over item is not 'group'", async () => {
      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'item-1', data: { current: { type: 'not-a-group' } } },
      } as DragEndEvent;

      await act(async () => { await result.current.handleDragEnd(event); });

      expect(mockOnBookmarkOpenTab).not.toHaveBeenCalled();
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);
    });

    test("should reset context even if active.data.current or over.data.current is missing", async () => {
      const { result } = getHook();
      const eventNoActiveData = {
        active: { id: 'tab-123' }, // No data.current
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragEndEvent;

      await act(async () => { await result.current.handleDragEnd(eventNoActiveData); });
      expect(mockOnBookmarkOpenTab).not.toHaveBeenCalled();
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);

      jest.clearAllMocks(); // Clear for next sub-test
      mockOnBookmarkOpenTab = jest.fn(); // Re-assign as it's cleared by jest.clearAllMocks

      const eventNoOverData = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'group1' }, // No data.current
      } as DragEndEvent;
      await act(async () => { await result.current.handleDragEnd(eventNoOverData); });
      expect(mockOnBookmarkOpenTab).not.toHaveBeenCalled();
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);
    });

    test('should reset context setters even if onBookmarkOpenTab throws an error', async () => {
      mockOnBookmarkOpenTab.mockRejectedValueOnce(new Error('Failed to bookmark tab'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error

      const { result } = getHook();
      const event = {
        active: { id: 'tab-123', data: { current: { type: 'tab', tab: mockOpenTab } } },
        over: { id: 'group1', data: { current: { type: 'group' } } },
      } as DragEndEvent;

      try {
        await act(async () => {
          await result.current.handleDragEnd(event);
        });
      } catch (_e) { // Renamed e to _e
        // Expected error
      }

      expect(mockOnBookmarkOpenTab).toHaveBeenCalledWith(mockOpenTab, 'group1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error handling drag end:', expect.any(Error));
      expect(mockSetActiveTab).toHaveBeenCalledWith(null);
      expect(mockSetActiveGroup).toHaveBeenCalledWith(null);

      consoleErrorSpy.mockRestore();
    });
  });
});
