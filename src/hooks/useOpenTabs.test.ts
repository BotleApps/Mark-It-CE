import { act, renderHook } from '@testing-library/react';
import { useOpenTabs } from './useOpenTabs'; // Assuming the hook is in this path
import type { Bookmark } from '../types'; // Assuming types are here

// Mock Chrome APIs related to tabs
let mockTabs: chrome.tabs.Tab[] = [];
let onUpdatedListeners: ((tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => void)[] = [];
let onRemovedListeners: ((tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => void)[] = [];
let onCreatedListeners: ((tab: chrome.tabs.Tab) => void)[] = []; // Added for onCreated

global.chrome = {
  tabs: {
    // @ts-ignore
    onCreated: { // Added mock for onCreated
      addListener: jest.fn((listener) => {
        onCreatedListeners.push(listener);
      }),
      removeListener: jest.fn((listener) => {
        onCreatedListeners = onCreatedListeners.filter(l => l !== listener);
      }),
    },
    query: jest.fn(async (queryInfo, callback) => {
      // Simulate filtering based on common queries, expand if needed
      let filteredTabs = mockTabs;
      if (queryInfo.currentWindow) {
        filteredTabs = filteredTabs.filter(tab => tab.windowId === chrome.windows.WINDOW_ID_CURRENT);
      }
      // Add more filters if your hook uses them
      if (callback) {
        callback(filteredTabs);
        return;
      }
      return Promise.resolve(filteredTabs);
    }),
    onUpdated: {
      addListener: jest.fn((listener) => {
        onUpdatedListeners.push(listener);
      }),
      removeListener: jest.fn((listener) => {
        onUpdatedListeners = onUpdatedListeners.filter(l => l !== listener);
      }),
    },
    onRemoved: {
      addListener: jest.fn((listener) => {
        onRemovedListeners.push(listener);
      }),
      removeListener: jest.fn((listener) => {
        onRemovedListeners = onRemovedListeners.filter(l => l !== listener);
      }),
    },
  },
  windows: {
    // @ts-ignore
    WINDOW_ID_CURRENT: 1, // Example window ID
  },
  runtime: {
    // @ts-ignore
    lastError: undefined,
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  // storage and other APIs might be needed if useBookmarks is deeply integrated
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  bookmarks: {
    getTree: jest.fn(),
    getChildren: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    removeTree: jest.fn(),
    getSubTree: jest.fn(),
  }
} as any;

// Mock useBookmarks hook as it's a dependency
jest.mock('./useBookmarks', () => ({
  useBookmarks: () => ({
    // Provide mock implementations for any functions from useBookmarks that useOpenTabs might call
    // For now, handleAddBookmark is the most likely candidate for handleBookmarkTab
    handleAddBookmark: jest.fn(async (spaceId: string, groupId: string, bookmark: Omit<Bookmark, 'id'>) => {
      return { ...bookmark, id: `mock-bookmark-${Date.now()}` };
    }),
    // Add other functions if your tests reveal they are used
  }),
}));


describe('useOpenTabs Hook', () => {
  beforeEach(() => {
    // Reset mocks and listeners before each test
    jest.clearAllMocks();
    mockTabs = [];
    onUpdatedListeners = [];
    onRemovedListeners = [];
    onCreatedListeners = []; // Reset onCreated listeners
    // @ts-ignore
    chrome.runtime.lastError = undefined;

    // Default mock for chrome.tabs.query
    (chrome.tabs.query as jest.Mock).mockImplementation(async (queryInfo, callback) => {
       let filteredTabs = mockTabs;
        if (queryInfo.currentWindow) {
            filteredTabs = filteredTabs.filter(tab => tab.windowId === chrome.windows.WINDOW_ID_CURRENT);
        }
        if (callback) {
            callback(filteredTabs);
            return;
        }
        return Promise.resolve(filteredTabs);
    });
  });

  // Test initial fetching of open tabs
  test('should fetch and set open tabs on initial load', async () => {
    const mockActiveSpace = {
      id: 'space1', name: 'Test Space', color: '#fff',
      groups: [{
        id: 'group1', name: 'Test Group', color: '#eee', bookmarks: [
          { id: 'bm1', title: 'Already Bookmarked', url: 'https://already-bookmarked.com', createdAt: '' }
        ], isExpanded: true
      }]
    };
    mockTabs = [
      { id: 1, title: 'Tab 1', url: 'https://tab1.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true },
      { id: 2, title: 'Tab 2', url: 'https://tab2.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 1, discarded: false, autoDiscardable: true },
      { id: 3, title: 'Chrome Settings', url: 'chrome://settings', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 2, discarded: false, autoDiscardable: true },
      { id: 4, title: 'Already Bookmarked Tab', url: 'https://already-bookmarked.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 3, discarded: false, autoDiscardable: true },
    ];

    const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));

    // Allow promises to resolve and state to update
    await act(async () => {
      await waitForNextUpdate(); // Or a more robust way to wait for async operations if needed
    });

    expect(chrome.tabs.query).toHaveBeenCalledWith({ currentWindow: true }, expect.any(Function));
    expect(result.current.openTabs).toHaveLength(2); // Tab 1 and Tab 2
    expect(result.current.openTabs.find(tab => tab.url === 'https://tab1.com')).toBeDefined();
    expect(result.current.openTabs.find(tab => tab.url === 'https://tab2.com')).toBeDefined();
    expect(result.current.openTabs.find(tab => tab.url === 'chrome://settings')).toBeUndefined();
    expect(result.current.openTabs.find(tab => tab.url === 'https://already-bookmarked.com')).toBeUndefined();
  });

  // Test updates when a tab is created/updated
  test('should update tabs list when a tab is updated (e.g. new tab loaded, or existing tab url changed)', async () => {
    const mockActiveSpace = { id: 's', name: 'S', color: '', groups: [] };
    mockTabs = [
      { id: 1, title: 'Old Title', url: 'https://initial.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true },
    ];
    const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));
    await act(async () => { await waitForNextUpdate(); }); // Initial fetch

    expect(result.current.openTabs.find(t => t.url === 'https://initial.com')).toBeDefined();

    // Simulate a tab update (e.g., navigation to a new URL in the same tab)
    const updatedTabInfo = { id: 1, title: 'New Title', url: 'https://updated.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true };
    mockTabs = [updatedTabInfo]; // Update the source of truth for the next query

    await act(async () => {
      // Trigger all onUpdated listeners
      for (const listener of onUpdatedListeners) {
        listener(1, { status: 'complete', url: 'https://updated.com' }, updatedTabInfo);
      }
      await waitForNextUpdate(); // Wait for re-fetch and state update
    });

    expect(chrome.tabs.query).toHaveBeenCalledTimes(2); // Initial + after update
    expect(result.current.openTabs).toHaveLength(1);
    expect(result.current.openTabs[0].title).toBe('New Title');
    expect(result.current.openTabs[0].url).toBe('https://updated.com');
  });

  test('should update tabs list when a new tab is created', async () => {
    const mockActiveSpace = { id: 's', name: 'S', color: '', groups: [] };
    mockTabs = [
      { id: 1, title: 'Existing Tab', url: 'https://existing.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true },
    ];
    const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));
    await act(async () => { await waitForNextUpdate(); }); // Initial fetch

    expect(result.current.openTabs.find(t => t.url === 'https://existing.com')).toBeDefined();

    // Simulate a new tab being created
    const newTabInfo = { id: 2, title: 'New Tab', url: 'https://newtab.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 1, discarded: false, autoDiscardable: true };
    mockTabs.push(newTabInfo); // Add to the source of truth

    await act(async () => {
      for (const listener of onCreatedListeners) { // Use onCreatedListeners
        listener(newTabInfo);
      }
      await waitForNextUpdate();
    });

    expect(chrome.tabs.query).toHaveBeenCalledTimes(2);
    expect(result.current.openTabs).toHaveLength(2);
    expect(result.current.openTabs.find(t => t.url === 'https://newtab.com')).toBeDefined();
  });


  // Test updates when a tab is removed
  test('should update tabs list when a tab is removed', async () => {
    const mockActiveSpace = { id: 's', name: 'S', color: '', groups: [] };
    mockTabs = [
      { id: 1, title: 'To Be Removed', url: 'https://toberemoved.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true },
      { id: 2, title: 'Stays', url: 'https://stays.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 1, discarded: false, autoDiscardable: true },
    ];
    const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));
    await act(async () => { await waitForNextUpdate(); }); // Initial fetch

    expect(result.current.openTabs.find(t => t.id === 1)).toBeDefined();

    // Simulate a tab removal
    mockTabs = mockTabs.filter(tab => tab.id !== 1); // Update the source of truth

    await act(async () => {
      // Trigger all onRemoved listeners
      for (const listener of onRemovedListeners) {
        listener(1, { windowId: chrome.windows.WINDOW_ID_CURRENT, isWindowClosing: false });
      }
      await waitForNextUpdate(); // Wait for re-fetch and state update
    });

    expect(chrome.tabs.query).toHaveBeenCalledTimes(2); // Initial + after removal
    expect(result.current.openTabs).toHaveLength(1);
    expect(result.current.openTabs.find(t => t.id === 1)).toBeUndefined();
    expect(result.current.openTabs[0].url).toBe('https://stays.com');
  });

  // Test handleBookmarkTab function
  describe('handleBookmarkTab', () => {
    test('should create a bookmark object from a tab and update internal state', async () => {
      const mockActiveSpace = { id: 's', name: 'S', color: '', groups: [] };
      const tabToBookmark: OpenTab = { id: 100, title: 'Bookmark Me', url: 'https://bookmarkme.com' };

      // Ensure the tab to be bookmarked is part of the initial openTabs
      mockTabs = [
        { id: 100, title: 'Bookmark Me', url: 'https://bookmarkme.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: true, index: 0, discarded: false, autoDiscardable: true },
        { id: 101, title: 'Another Tab', url: 'https://another.com', windowId: chrome.windows.WINDOW_ID_CURRENT, incognito: false, pinned: false, highlighted: false, active: false, index: 1, discarded: false, autoDiscardable: true },
      ];

      const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));
      await act(async () => { await waitForNextUpdate(); }); // Initial fetch

      expect(result.current.openTabs.find(t => t.id === tabToBookmark.id)).toBeDefined(); // Verify it's initially there

      let bookmarkOutput;
      await act(async () => {
        bookmarkOutput = await result.current.handleBookmarkTab(tabToBookmark, 'group1');
      });

      expect(bookmarkOutput).toBeDefined();
      expect(bookmarkOutput.title).toBe(tabToBookmark.title);
      expect(bookmarkOutput.url).toBe(tabToBookmark.url);
      expect(bookmarkOutput.createdAt).toBeDefined();
      expect(() => new Date(bookmarkOutput.createdAt).toISOString()).not.toThrow(); // Check for valid ISO string

      // Check if the tab was removed from openTabs state (as it's now "saved")
      // The hook's fetchOpenTabs will be called again due to savedTabIds changing,
      // and it should filter out the newly saved tab.
      // To test this accurately, we need to ensure chrome.tabs.query is called again.
      // The current hook implementation calls fetchOpenTabs directly from handleBookmarkTab
      // *after* updating savedTabIds, but fetchOpenTabs is memoized and might not re-run
      // if its dependencies (savedTabIds, getBookmarkedUrls) haven't changed in a way that
      // invalidates the memo.
      // However, the logic is: setSavedTabIds -> setOpenTabs (filter)
      // So, the openTabs should be updated directly.

      expect(result.current.openTabs.find(t => t.id === tabToBookmark.id)).toBeUndefined();
      expect(result.current.openTabs.find(t => t.id === 101)).toBeDefined(); // The other tab should remain
    });

    // As per previous reasoning, tabs with no URL or chrome:// URLs are filtered
    // by fetchOpenTabs before they would ever be passed to handleBookmarkTab.
    // So, a dedicated test here for that specific case on handleBookmarkTab might be redundant
    // if we trust the filtering in fetchOpenTabs (which is tested by the initial load test).
  });

  // Test error handling if chrome.tabs.query fails
  test('should result in empty openTabs if fetching tabs encounters an error', async () => {
    const mockActiveSpace = { id: 's', name: 'S', color: '', groups: [] };

    // Simulate chrome.tabs.query failing by setting chrome.runtime.lastError
    // and ensuring the callback might be called with undefined or empty tabs
    (chrome.tabs.query as jest.Mock).mockImplementation(async (queryInfo, callback) => {
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Simulated error fetching tabs' };
      if (callback) {
        callback(undefined); // Simulate tabs being undefined due to error
      }
      // Or, if the API directly threw, the promise way:
      // return Promise.reject(new Error("Simulated error"));
    });

    // Spy on console.error to check if the hook logs the error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result, waitForNextUpdate } = renderHook(() => useOpenTabs(mockActiveSpace));

    await act(async () => {
      // Allow promises to resolve. Since query might call callback directly,
      // waitForNextUpdate might not be strictly needed if state updates synchronously after error.
      // However, good to keep if there's any async nature to error handling.
      // Given the hook doesn't have explicit error async handling, this might be immediate.
    });

    // The hook doesn't explicitly set an error state in its return.
    // We check that openTabs is empty, which is the current behavior on error or no tabs.
    expect(result.current.openTabs).toEqual([]);

    // Optionally, check if an error was logged, if the hook were to implement that.
    // As the hook doesn't currently log chrome.runtime.lastError, this spy won't be called by the hook itself.
    // If the hook were modified to console.error(chrome.runtime.lastError), this would be useful.
    // For now, this primarily tests that the hook doesn't crash and results in empty tabs.

    consoleErrorSpy.mockRestore();
  });
});
