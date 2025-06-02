import { act, renderHook } from '@testing-library/react';
import { useBookmarks } from './useBookmarks'; // Assuming the hook is in this path

// Define a minimal type for the parts of chrome API used in mocks
type MockChrome = {
  storage: {
    local: {
      get: jest.Mock;
      set: jest.Mock;
    };
  };
  bookmarks: {
    getTree: jest.Mock;
    getChildren: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    removeTree: jest.Mock;
    getSubTree?: jest.Mock; // Added getSubTree as it's used in later tests
  };
  runtime?: { // Optional runtime part if needed for other tests
    onMessage?: {
        addListener: jest.Mock;
        removeListener: jest.Mock;
    };
    lastError?: chrome.runtime.LastError | undefined;
  }
};

// Mock Chrome APIs
global.chrome = {
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
    getSubTree: jest.fn(), // Ensure getSubTree is part of the mock
  },
  runtime: { // Mock runtime for onMessage listeners if useBookmarks uses it
    onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
    }
  }
} as MockChrome;

// Mock for file operations (FileReader, URL.createObjectURL, etc.)
global.FileReader = jest.fn(() => ({
  readAsText: jest.fn(),
  onload: null, // onload should be assignable to ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
  onerror: null, // onerror should be assignable to ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
})) as jest.MockedClass<typeof FileReader>; // Use jest.MockedClass for constructor mocks

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock for toast notifications
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('useBookmarks Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      callback({}); // Simulate empty storage initially
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation((items, callback) => {
      if (callback) {
        callback();
      }
    });
    (chrome.bookmarks.getTree as jest.Mock).mockImplementation((callback) => {
      callback([{ id: 'root', children: [] }]); // Simulate empty bookmarks tree
    });
     (chrome.bookmarks.getChildren as jest.Mock).mockImplementation((id, callback) => {
      callback([]); // Simulate no children for any given ID
    });
    (chrome.bookmarks.create as jest.Mock).mockImplementation((bookmark, callback) => {
      if (callback) {
        callback({ id: String(Math.random()), ...bookmark });
      }
    });
    (chrome.bookmarks.update as jest.Mock).mockImplementation((id, changes, callback) => {
      if (callback) {
        callback({ id, ...changes });
      }
    });
    (chrome.bookmarks.removeTree as jest.Mock).mockImplementation((id, callback) => {
      if (callback) {
        callback();
      }
    });
  });

  test('should initialize with default state when storage is empty', async () => {
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      // Simulate empty storage
      callback({});
    });

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.spaces).toHaveLength(1);
    expect(result.current.spaces[0].id).toBe('default');
    expect(result.current.spaces[0].name).toBe('Default');
    expect(result.current.activeSpaceId).toBe('default');
  });

  test('should load spaces and activeSpaceId from storage', async () => {
    const mockSpaces = [
      { id: 'space1', name: 'Work', color: '#FF0000', groups: [] },
      { id: 'space2', name: 'Personal', color: '#00FF00', groups: [] },
    ];
    const mockLastActiveSpace = 'space2';

    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      callback({ spaces: mockSpaces, lastActiveSpace: mockLastActiveSpace });
    });

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.spaces).toEqual(mockSpaces);
    expect(result.current.activeSpaceId).toBe(mockLastActiveSpace);
  });

  test('should set activeSpaceId to the first space if lastActiveSpace is not in storage but spaces exist', async () => {
    const mockSpaces = [
      { id: 'space1', name: 'Work', color: '#FF0000', groups: [] },
    ];

    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      // Simulate storage with spaces but no lastActiveSpace
      callback({ spaces: mockSpaces });
    });

    const { result } = renderHook(() => useBookmarks());
    expect(result.current.spaces).toEqual(mockSpaces);
    // It should default to the first space's ID if lastActiveSpace is missing
    expect(result.current.activeSpaceId).toBe('space1');
  });


  // Tests for spaces
  describe('Spaces', () => {
    test('should create a new space', async () => {
      const { result } = renderHook(() => useBookmarks());
      const newSpaceData = { name: 'New Space', color: '#0000FF' };

      let createdSpace;
      await act(async () => {
        createdSpace = await result.current.handleCreateSpace(newSpaceData);
      });

      expect(createdSpace).toBeDefined();
      expect(createdSpace!.name).toBe(newSpaceData.name);
      expect(createdSpace!.color).toBe(newSpaceData.color);
      expect(createdSpace!.groups).toHaveLength(1); // Default group
      expect(result.current.spaces).toEqual(expect.arrayContaining([expect.objectContaining(newSpaceData)]));
      expect(result.current.activeSpaceId).toBe(createdSpace!.id);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: expect.arrayContaining([expect.objectContaining(newSpaceData)]),
      });
    });

    test('should update an existing space', async () => {
      const initialSpaces = [{ id: 's1', name: 'Initial Space', color: '#111', groups: [] }];
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: initialSpaces, lastActiveSpace: 's1' });
      });

      const { result } = renderHook(() => useBookmarks());
      
      // Wait for initial load
      await act(async () => {
        // Ensure state is updated from mock
        (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
          callback({ spaces: result.current.spaces, lastActiveSpace: result.current.activeSpaceId });
        });
      });
      
      const updatedSpaceData = { ...initialSpaces[0], name: 'Updated Space Name' };

      await act(async () => {
        await result.current.handleUpdateSpace(updatedSpaceData);
      });

      expect(result.current.spaces.find(s => s.id === 's1')?.name).toBe('Updated Space Name');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: [updatedSpaceData],
      });
    });

    test('should delete a space and update activeSpaceId', async () => {
      const initialSpaces = [
        { id: 's1', name: 'Space 1', color: '#111', groups: [] },
        { id: 's2', name: 'Space 2', color: '#222', groups: [] },
      ];
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: initialSpaces, lastActiveSpace: 's1' });
      });
      const { result } = renderHook(() => useBookmarks());

      // Wait for initial load
      await act(async () => {
         (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
          callback({ spaces: result.current.spaces, lastActiveSpace: result.current.activeSpaceId });
        });
      });

      await act(async () => {
        await result.current.handleDeleteSpace('s1');
      });

      expect(result.current.spaces.find(s => s.id === 's1')).toBeUndefined();
      expect(result.current.spaces).toHaveLength(1);
      expect(result.current.activeSpaceId).toBe('s2'); // Active space should shift to s2
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: [initialSpaces[1]], // Only s2 should remain
      });
    });

     test('should delete the last space and clear activeSpaceId', async () => {
      const initialSpaces = [{ id: 's1', name: 'Only Space', color: '#111', groups: [] }];
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: initialSpaces, lastActiveSpace: 's1' });
      });

      const { result } = renderHook(() => useBookmarks());
      await act(async () => {
         (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
          callback({ spaces: result.current.spaces, lastActiveSpace: result.current.activeSpaceId });
        });
      });

      await act(async () => {
        await result.current.handleDeleteSpace('s1');
      });

      expect(result.current.spaces).toHaveLength(0);
      expect(result.current.activeSpaceId).toBe('');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: [],
      });
    });
  });

  // Tests for groups
  describe('Groups', () => {
    const initialSpaceId = 's1';
    const initialSpaces = [
      {
        id: initialSpaceId,
        name: 'Test Space',
        color: '#123456',
        groups: [{ id: 'g1', name: 'Initial Group', color: '#abcdef', bookmarks: [], isExpanded: true }],
      },
    ];

    beforeEach(() => {
      // Setup initial state for group tests
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: initialSpaces, lastActiveSpace: initialSpaceId });
      });
      // Mock window.confirm for deletion tests
      global.window.confirm = jest.fn(() => true);
    });

    afterEach(() => {
        // Restore original window.confirm if it was mocked
        jest.restoreAllMocks();
    });

    test('should create a new group in a space', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });


      const newGroupData = { name: 'New Group', color: '#fedcba' };
      let createdGroup;
      await act(async () => {
        createdGroup = await result.current.handleCreateGroup(initialSpaceId, newGroupData);
      });

      expect(createdGroup).toBeDefined();
      expect(createdGroup!.name).toBe(newGroupData.name);
      expect(createdGroup!.color).toBe(newGroupData.color);
      expect(createdGroup!.bookmarks).toEqual([]);
      const targetSpace = result.current.spaces.find(s => s.id === initialSpaceId);
      expect(targetSpace!.groups).toEqual(expect.arrayContaining([expect.objectContaining(newGroupData)]));
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: expect.arrayContaining([
          expect.objectContaining({
            id: initialSpaceId,
            groups: expect.arrayContaining([expect.objectContaining(newGroupData)]),
          }),
        ]),
      });
    });

    test('should update an existing group', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const updatedGroupData = { ...initialSpaces[0].groups[0], name: 'Updated Group Name' };
      await act(async () => {
        await result.current.handleUpdateGroup(initialSpaceId, updatedGroupData);
      });

      const targetSpace = result.current.spaces.find(s => s.id === initialSpaceId);
      expect(targetSpace!.groups.find(g => g.id === 'g1')?.name).toBe('Updated Group Name');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: expect.arrayContaining([
          expect.objectContaining({
            id: initialSpaceId,
            groups: [expect.objectContaining({ name: 'Updated Group Name' })],
          }),
        ]),
      });
    });

    test('should delete a group', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleDeleteGroup(initialSpaceId, 'g1');
      });
      
      expect(window.confirm).toHaveBeenCalled();
      const targetSpace = result.current.spaces.find(s => s.id === initialSpaceId);
      expect(targetSpace!.groups.find(g => g.id === 'g1')).toBeUndefined();
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        spaces: expect.arrayContaining([
          expect.objectContaining({
            id: initialSpaceId,
            groups: [], // g1 should be deleted
          }),
        ]),
      });
    });

    test('should not delete a group if user cancels', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false); // Simulate user clicking "Cancel"
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleDeleteGroup(initialSpaceId, 'g1');
      });

      expect(window.confirm).toHaveBeenCalled();
      const targetSpace = result.current.spaces.find(s => s.id === initialSpaceId);
      expect(targetSpace!.groups.find(g => g.id === 'g1')).toBeDefined(); // Group should still exist
      expect(chrome.storage.local.set).not.toHaveBeenCalled(); // Storage should not be updated
    });
  });

  // Tests for bookmarks
  describe('Bookmarks', () => {
    const initialSpaceId = 's1';
    const initialGroupId = 'g1';
    const initialBookmarkId = 'b1';
    const initialSpaces = [
      {
        id: initialSpaceId,
        name: 'Test Space',
        color: '#123456',
        groups: [
          {
            id: initialGroupId,
            name: 'Test Group',
            color: '#abcdef',
            bookmarks: [{ id: initialBookmarkId, title: 'Test Bookmark', url: 'https://example.com', createdAt: new Date().toISOString() }],
            isExpanded: true,
          },
        ],
      },
    ];

    beforeEach(() => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: JSON.parse(JSON.stringify(initialSpaces)), lastActiveSpace: initialSpaceId }); // Deep copy
      });
      global.window.confirm = jest.fn(() => true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should add a new bookmark to a group', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const newBookmarkData = { title: 'New Bookmark', url: 'https://new.example.com' };
      let createdBookmark;
      await act(async () => {
        createdBookmark = await result.current.handleAddBookmark(initialSpaceId, initialGroupId, newBookmarkData);
      });

      expect(createdBookmark).toBeDefined();
      expect(createdBookmark!.title).toBe(newBookmarkData.title);
      expect(createdBookmark!.url).toBe(newBookmarkData.url);
      const targetGroup = result.current.spaces.find(s => s.id === initialSpaceId)?.groups.find(g => g.id === initialGroupId);
      expect(targetGroup!.bookmarks).toEqual(expect.arrayContaining([expect.objectContaining(newBookmarkData)]));
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should update an existing bookmark', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const updatedBookmarkData = { id: initialBookmarkId, title: 'Updated Bookmark Title', url: 'https://updated.example.com', createdAt: initialSpaces[0].groups[0].bookmarks[0].createdAt };
      await act(async () => {
        await result.current.handleUpdateBookmark(initialSpaceId, initialGroupId, updatedBookmarkData);
      });

      const targetGroup = result.current.spaces.find(s => s.id === initialSpaceId)?.groups.find(g => g.id === initialGroupId);
      expect(targetGroup!.bookmarks.find(b => b.id === initialBookmarkId)?.title).toBe('Updated Bookmark Title');
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should delete a bookmark', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleDeleteBookmark(initialSpaceId, initialGroupId, initialBookmarkId);
      });
      
      expect(window.confirm).toHaveBeenCalled();
      const targetGroup = result.current.spaces.find(s => s.id === initialSpaceId)?.groups.find(g => g.id === initialGroupId);
      expect(targetGroup!.bookmarks.find(b => b.id === initialBookmarkId)).toBeUndefined();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should not delete a bookmark if user cancels', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleDeleteBookmark(initialSpaceId, initialGroupId, initialBookmarkId);
      });

      expect(window.confirm).toHaveBeenCalled();
      const targetGroup = result.current.spaces.find(s => s.id === initialSpaceId)?.groups.find(g => g.id === initialGroupId);
      expect(targetGroup!.bookmarks.find(b => b.id === initialBookmarkId)).toBeDefined();
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  // Tests for Chrome bookmark import
  describe('Chrome Bookmark Import', () => {
    const targetSpaceId = 's1';
    const initialSpaces = [
      { id: targetSpaceId, name: 'Target Space', color: '#777', groups: [] },
    ];

    beforeEach(() => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: JSON.parse(JSON.stringify(initialSpaces)), lastActiveSpace: targetSpaceId });
      });
      (chrome.bookmarks.getSubTree as jest.Mock).mockImplementation(async (folderId) => {
        if (folderId === 'folder1') {
          return [{
            id: 'folder1Node',
            title: 'Imported Folder 1',
            children: [
              { id: 'bm1', title: 'Bookmark 1', url: 'https://bookmark1.com', dateAdded: Date.now() },
              {
                id: 'subfolder1',
                title: 'Subfolder 1',
                children: [
                  { id: 'bm2', title: 'Bookmark 2', url: 'https://bookmark2.com', dateAdded: Date.now() },
                ],
                dateAdded: Date.now()
              },
            ],
            dateAdded: Date.now()
          }];
        }
        if (folderId === 'folder2') {
           return [{
            id: 'folder2Node',
            title: 'Imported Folder 2',
            children: [
              { id: 'bm3', title: 'Bookmark 3', url: 'https://bookmark3.com', dateAdded: Date.now() },
            ],
            dateAdded: Date.now()
          }];
        }
        return [];
      });
    });

    test('should import bookmarks from selected Chrome folders into a space', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleImportChromeBookmarks(['folder1', 'folder2'], targetSpaceId);
      });

      const targetSpace = result.current.spaces.find(s => s.id === targetSpaceId);
      expect(targetSpace).toBeDefined();
      expect(targetSpace!.groups.length).toBeGreaterThanOrEqual(2); // Should have at least 'Imported Folder 1' and 'Imported Folder 2'

      const folder1Group = targetSpace!.groups.find(g => g.name === 'Imported Folder 1');
      expect(folder1Group).toBeDefined();
      expect(folder1Group!.bookmarks.find(b => b.url === 'https://bookmark1.com')).toBeDefined();
      
      // Check for the subfolder's bookmarks within its own group
      const subfolder1Group = targetSpace!.groups.find(g => g.name === 'Subfolder 1');
      expect(subfolder1Group).toBeDefined();
      expect(subfolder1Group!.bookmarks.find(b => b.url === 'https://bookmark2.com')).toBeDefined();

      const folder2Group = targetSpace!.groups.find(g => g.name === 'Imported Folder 2');
      expect(folder2Group).toBeDefined();
      expect(folder2Group!.bookmarks.find(b => b.url === 'https://bookmark3.com')).toBeDefined();

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    test('should do nothing if chrome.bookmarks API is not available', async () => {
      const originalChromeBookmarks = chrome.bookmarks;
      // @ts-expect-error // Simulate API not being available for this test
      chrome.bookmarks = undefined; 

      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        await result.current.handleImportChromeBookmarks(['folder1'], targetSpaceId);
      });

      const targetSpace = result.current.spaces.find(s => s.id === targetSpaceId);
      expect(targetSpace!.groups.length).toBe(0); // No groups should be added
      expect(chrome.storage.local.set).not.toHaveBeenCalled();

      chrome.bookmarks = originalChromeBookmarks; // Restore
    });
  });

  // Tests for file export and import
  describe('File Export/Import', () => {
    const initialSpaces = [
      {
        id: 's1', name: 'Existing Space', color: '#111',
        groups: [{
          id: 'g1', name: 'Existing Group', color: '#aaa', isExpanded: true,
          bookmarks: [{ id: 'b1', title: 'Existing Bookmark', url: 'https://existing.com', createdAt: '2023-01-01T00:00:00.000Z' }]
        }]
      }
    ];
    const mockSettings = { theme: 'dark' };

    beforeEach(() => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ spaces: JSON.parse(JSON.stringify(initialSpaces)), lastActiveSpace: 's1' });
      });
      global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
      global.URL.revokeObjectURL = jest.fn();
      // @ts-expect-error // Mocking document.createElement for test
      global.document.createElement = jest.fn(() => ({
        href: '',
        download: '',
        click: jest.fn(),
        appendChild: jest.fn(),
        removeChild: jest.fn(),
      }));
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
    });

    test('should export bookmarks to a file', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      await act(async () => {
        // @ts-expect-error // settings prop is AppSettings, handleExportBookmarks expects AppSettings
        await result.current.handleExportBookmarks(mockSettings);
      });

      expect(URL.createObjectURL).toHaveBeenCalled();
      const createObjectURLCall = (URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(createObjectURLCall instanceof Blob).toBe(true);
      // You might want to read the blob content and parse JSON to verify structure if needed,
      // but for now, we'll trust the implementation detail or add more specific blob checks later.
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(toast.success).toHaveBeenCalledWith('Bookmarks exported successfully');
    });

    test('should import bookmarks from a file, merging with existing data', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const importedData = {
        version: '1.0',
        settings: { theme: 'light' },
        spaces: [
          { // Existing space, new group, new bookmark
            id: 's1', name: 'Existing Space Updated', color: '#111', // Name/color of space itself is not updated by merge logic
            groups: [
              {
                id: 'gNew', name: 'Imported Group', color: '#bbb', isExpanded: true,
                bookmarks: [{ id: 'bNew', title: 'Imported Bookmark', url: 'https://imported.com', createdAt: '2023-01-02T00:00:00.000Z' }]
              },
              { // Existing group, new bookmark, duplicate bookmark (by URL)
                id: 'g1', name: 'Existing Group', color: '#aaa', isExpanded: true,
                bookmarks: [
                  { id: 'b2', title: 'Another New Bookmark', url: 'https://anothernew.com', createdAt: '2023-01-03T00:00:00.000Z' },
                  { id: 'b1Duplicate', title: 'Existing Bookmark Duplicate', url: 'https://existing.com', createdAt: '2023-01-01T00:00:00.000Z'}
                ]
              }
            ]
          },
          { // New space
            id: 'sNew', name: 'New Imported Space', color: '#222',
            groups: [{
              id: 'gSNew', name: 'Group in New Space', color: '#ccc', isExpanded: true,
              bookmarks: [{ id: 'bSNew', title: 'Bookmark in New Space', url: 'https://newspace.com', createdAt: '2023-01-04T00:00:00.000Z' }]
            }]
          }
        ]
      };

      await act(async () => {
        await result.current.handleImportBookmarksFromFile(importedData);
      });
      
      const finalSpaces = result.current.spaces;
      // Check new space
      const newImportedSpace = finalSpaces.find(s => s.name === 'New Imported Space');
      expect(newImportedSpace).toBeDefined();
      expect(newImportedSpace!.groups[0].bookmarks[0].url).toBe('https://newspace.com');

      // Check existing space s1
      const existingSpaceS1 = finalSpaces.find(s => s.id === 's1');
      expect(existingSpaceS1).toBeDefined();
      
      // Check new group in s1
      const importedGroupInS1 = existingSpaceS1!.groups.find(g => g.name === 'Imported Group');
      expect(importedGroupInS1).toBeDefined();
      expect(importedGroupInS1!.bookmarks[0].url).toBe('https://imported.com');

      // Check existing group g1 in s1
      const existingGroupG1 = existingSpaceS1!.groups.find(g => g.id === 'g1');
      expect(existingGroupG1).toBeDefined();
      expect(existingGroupG1!.bookmarks.length).toBe(2); // Original + one new, duplicate ignored
      expect(existingGroupG1!.bookmarks.find(b => b.url === 'https://existing.com')).toBeDefined();
      expect(existingGroupG1!.bookmarks.find(b => b.url === 'https://anothernew.com')).toBeDefined();
      
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Bookmarks imported and merged successfully');
    });

    test('should show error for invalid file format during import', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const invalidData = { some: 'random', data: 'structure' };
      await act(async () => {
        await result.current.handleImportBookmarksFromFile(invalidData);
      });

      expect(result.current.spaces).toEqual(initialSpaces); // State should not change
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Invalid import file format');
    });
     test('should show error for invalid space structure during import', async () => {
      const { result } = renderHook(() => useBookmarks());
      // Removed: await act(async () => { /* allow initial load */ });

      const invalidData = { version: '1.0', spaces: [{id: 's1' /* missing name, color, groups */}] };
      await act(async () => {
        await result.current.handleImportBookmarksFromFile(invalidData);
      });
      expect(toast.error).toHaveBeenCalledWith('Invalid space format in import file');
    });
  });
});
