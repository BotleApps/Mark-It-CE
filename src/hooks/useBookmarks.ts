import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Space, BookmarkGroup, Bookmark, BookmarkExport, AppSettings } from '../types';

const defaultGroup: BookmarkGroup = {
  id: 'default',
  name: 'Default Group',
  color: '#3B82F6',
  bookmarks: [],
  isExpanded: true,
};

const defaultSpace: Space = {
  id: 'default',
  name: 'Default',
  color: '#6B7280',
  groups: [defaultGroup],
};

// Helper function to generate unique IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useBookmarks() {
  const [spaces, setSpaces] = useState<Space[]>(() => [defaultSpace]);
  const [activeSpaceId, setActiveSpaceId] = useState<string>('');

  // Force refresh spaces from storage
  const refreshSpaces = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['spaces'], (result) => {
        if (result.spaces) {
          setSpaces(result.spaces);
        }
      });
    }
  }, []);

  // Listen for space refresh messages
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Define a more specific type for the runtime message
      interface RuntimeMessage {
        type?: string;
        // Add other properties if messages can have more structure
      }
      const listener = (message: RuntimeMessage) => {
        if (message.type === 'REFRESH_SPACES') {
          refreshSpaces();
        }
      };

      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, [refreshSpaces]);

  // Load spaces and last active space
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['spaces', 'lastActiveSpace'], (result) => {
        if (result.spaces) {
          setSpaces(result.spaces);
        }
        if (result.lastActiveSpace) {
          setActiveSpaceId(result.lastActiveSpace);
        } else {
          setActiveSpaceId(defaultSpace.id);
        }
      });
    } else {
      setActiveSpaceId(defaultSpace.id);
    }
  }, []);

  // Save last active space whenever it changes
  useEffect(() => {
    if (activeSpaceId && typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ lastActiveSpace: activeSpaceId });
    }
  }, [activeSpaceId]);

  const handleCreateSpace = useCallback(async (newSpace: Omit<Space, 'id' | 'groups'>) => {
    const space: Space = {
      ...newSpace,
      id: generateUniqueId('space'),
      groups: [{
        id: generateUniqueId('group'),
        name: 'Default Group',
        color: '#3B82F6',
        bookmarks: [],
        isExpanded: true,
      }],
    };

    const newSpaces = [...spaces, space];
    setSpaces(newSpaces);
    setActiveSpaceId(space.id);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }

    return space;
  }, [spaces]);

  const handleUpdateSpace = useCallback(async (updatedSpace: Space) => {
    const newSpaces = spaces.map(space =>
      space.id === updatedSpace.id ? updatedSpace : space
    );
    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }
  }, [spaces]);

  const handleDeleteSpace = useCallback(async (spaceId: string) => {
    const newSpaces = spaces.filter(space => space.id !== spaceId);
    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }

    if (newSpaces.length > 0) {
      setActiveSpaceId(newSpaces[0].id);
    } else {
      setActiveSpaceId('');
    }
  }, [spaces]);

  const handleCreateGroup = useCallback(async (spaceId: string, newGroup: Omit<BookmarkGroup, 'id' | 'bookmarks'>) => {
    const group: BookmarkGroup = {
      ...newGroup,
      id: generateUniqueId('group'),
      bookmarks: [],
      isExpanded: true,
    };

    const newSpaces = spaces.map(space =>
      space.id === spaceId
        ? { ...space, groups: [...space.groups, group] }
        : space
    );
    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }

    return group;
  }, [spaces]);

  const handleUpdateGroup = useCallback(async (spaceId: string, updatedGroup: BookmarkGroup) => {
    const newSpaces = spaces.map(space =>
      space.id === spaceId
        ? {
            ...space,
            groups: space.groups.map(group =>
              group.id === updatedGroup.id ? updatedGroup : group
            )
          }
        : space
    );
    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }
  }, [spaces]);

  const handleDeleteGroup = useCallback(async (spaceId: string, groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group and all its bookmarks?')) {
      const newSpaces = spaces.map(space =>
        space.id === spaceId
          ? {
              ...space,
              groups: space.groups.filter(group => group.id !== groupId)
            }
          : space
      );
      setSpaces(newSpaces);

      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ spaces: newSpaces });
      }
    }
  }, [spaces]);

  const handleAddBookmark = useCallback(async (spaceId: string, groupId: string, bookmark: Omit<Bookmark, 'id'>) => {
    console.log('useBookmarks: handleAddBookmark called');
    console.log('useBookmarks: spaceId', spaceId);
    console.log('useBookmarks: groupId', groupId);
    console.log('useBookmark: bookmark', bookmark);

    const newBookmark: Bookmark = {
      ...bookmark,
      id: generateUniqueId('bookmark'),
    };

    const newSpaces = spaces.map(space =>
      space.id === spaceId
        ? {
            ...space,
            groups: space.groups.map(group =>
              group.id === groupId
                ? {
                    ...group,
                    bookmarks: [...group.bookmarks, newBookmark]
                  }
                : group
            )
          }
        : space
    );

    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }

    return newBookmark;
  }, [spaces]);

  const handleUpdateBookmark = useCallback(async (spaceId: string, groupId: string, updatedBookmark: Bookmark) => {
    const newSpaces = spaces.map(space =>
      space.id === spaceId
        ? {
            ...space,
            groups: space.groups.map(group =>
              group.id === groupId
                ? {
                    ...group,
                    bookmarks: group.bookmarks.map(bookmark =>
                      bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark
                    )
                  }
                : group
            )
          }
        : space
    );

    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }
  }, [spaces]);

  const handleDeleteBookmark = useCallback(async (spaceId: string, groupId: string, bookmarkId: string) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
    const newSpaces = spaces.map(space =>
      space.id === spaceId
        ? {
            ...space,
            groups: space.groups.map(group =>
              group.id === groupId
                ? {
                    ...group,
                    bookmarks: group.bookmarks.filter(bookmark => bookmark.id !== bookmarkId)
                  }
                : group
            )
          }
        : space
    );

    setSpaces(newSpaces);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ spaces: newSpaces });
    }
  }
  }, [spaces]);

  const handleImportChromeBookmarks = async (folderIds: string[], spaceId: string) => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome bookmarks API not available');
      return;
    }

    try {
      const newGroups: BookmarkGroup[] = [];
      // Map to track processed folders using Chrome bookmark ID as key
      const processedFolders = new Map<string, string>();

      const traverseBookmarks = async (
        node: chrome.bookmarks.BookmarkTreeNode,
        parentGroupId: string | null = null
      ) => {
        if (node.url) {
          // Handle bookmark
          const group = newGroups.find(g => g.id === parentGroupId);
          if (group) {
            group.bookmarks.push({
              id: generateUniqueId('bookmark'),
              title: node.title,
              url: node.url,
              createdAt: new Date().toISOString(),
            });
          }
        } else if (node.children) {
          // Check if this folder was already processed
          let groupId = processedFolders.get(node.id);

          if (!groupId) {
            // Create new group only if it hasn't been processed
            groupId = generateUniqueId('group');
            const newGroup: BookmarkGroup = {
              id: groupId,
              name: node.title || 'Imported Folder',
              color: '#3B82F6',
              bookmarks: [],
              isExpanded: true,
            };
            newGroups.push(newGroup);
            processedFolders.set(node.id, groupId);
          }

          // Process children
          for (const child of node.children) {
            await traverseBookmarks(child, groupId);
          }
        }
      };

      // Process selected folders
      for (const folderId of folderIds) {
        // Skip if already processed
        if (!processedFolders.has(folderId)) {
          const nodes = await chrome.bookmarks.getSubTree(folderId);
          for (const node of nodes) {
            await traverseBookmarks(node);
          }
        }
      }

      // Update spaces with unique groups
      const newSpaces = spaces.map(space =>
        space.id === spaceId
          ? { ...space, groups: [...space.groups, ...newGroups] }
          : space
      );

      setSpaces(newSpaces);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ spaces: newSpaces });
      }
    } catch (error) {
      console.error('Error importing Chrome bookmarks:', error);
      throw error;
    }
  };

  const handleImportBookmarksFromFile = async (importData: unknown): Promise<void> => {
    try {
      // Type guard function to validate BookmarkExport
      const isBookmarkExport = (data: unknown): data is BookmarkExport => { // Changed data: any to data: unknown
        return (
          data !== null && // Ensure data is not null before checking typeof
          typeof data === 'object' &&
          'version' in data &&
          'spaces' in data &&
          Array.isArray((data as BookmarkExport).spaces) && // Type assertion for spaces
          (data as BookmarkExport).spaces.every((space: unknown) => // Changed space: any to space: unknown
            space !== null &&
            typeof space === 'object' &&
            'id' in space &&
            'name' in space &&
            'color' in space &&
            'groups' in space &&
            Array.isArray(space.groups)
          )
        );
      };

      if (!isBookmarkExport(importData)) {
        throw new Error('Invalid import file format');
      }

      // Validate spaces structure
      for (const space of importData.spaces) {
        if (!space.id || !space.name || !space.color || !Array.isArray(space.groups)) {
          throw new Error('Invalid space format in import file');
        }

        // Validate groups
        for (const group of space.groups) {
          if (!group.id || !group.name || !group.color || !Array.isArray(group.bookmarks)) {
            throw new Error('Invalid group format in import file');
          }

          // Validate bookmarks
          for (const bookmark of group.bookmarks) {
            if (!bookmark.id || !bookmark.title || !bookmark.url || !bookmark.createdAt) {
              throw new Error('Invalid bookmark format in import file');
            }
          }
        }
      }

      // Merge imported spaces with existing ones instead of replacing
      const mergedSpaces = [...spaces];
      
      for (const importedSpace of importData.spaces) {
        const existingSpaceIndex = mergedSpaces.findIndex(space => space.id === importedSpace.id);
        
        if (existingSpaceIndex !== -1) {
          // Space exists, merge groups
          const existingSpace = mergedSpaces[existingSpaceIndex];
          const mergedGroups = [...existingSpace.groups];
          
          for (const importedGroup of importedSpace.groups) {
            const existingGroupIndex = mergedGroups.findIndex(group => group.id === importedGroup.id);
            
            if (existingGroupIndex !== -1) {
              // Group exists, merge bookmarks
              const existingGroup = mergedGroups[existingGroupIndex];
              const mergedBookmarks = [...existingGroup.bookmarks];
              
              for (const importedBookmark of importedGroup.bookmarks) {
                // Only add if bookmark with same URL doesn't already exist in this group
                const bookmarkExists = mergedBookmarks.some(bookmark => bookmark.url === importedBookmark.url);
                if (!bookmarkExists) {
                  // Generate new ID to avoid conflicts
                  mergedBookmarks.push({
                    ...importedBookmark,
                    id: generateUniqueId('bookmark')
                  });
                }
              }
              
              mergedGroups[existingGroupIndex] = {
                ...existingGroup,
                bookmarks: mergedBookmarks
              };
            } else {
              // Group doesn't exist, add it with new IDs for all bookmarks
              const newGroup = {
                ...importedGroup,
                id: generateUniqueId('group'),
                bookmarks: importedGroup.bookmarks.map(bookmark => ({
                  ...bookmark,
                  id: generateUniqueId('bookmark')
                }))
              };
              mergedGroups.push(newGroup);
            }
          }
          
          mergedSpaces[existingSpaceIndex] = {
            ...existingSpace,
            groups: mergedGroups
          };
        } else {
          // Space doesn't exist, add it with new IDs
          const newSpace = {
            ...importedSpace,
            id: generateUniqueId('space'),
            groups: importedSpace.groups.map(group => ({
              ...group,
              id: generateUniqueId('group'),
              bookmarks: group.bookmarks.map(bookmark => ({
                ...bookmark,
                id: generateUniqueId('bookmark')
              }))
            }))
          };
          mergedSpaces.push(newSpace);
        }
      }

      setSpaces(mergedSpaces);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ spaces: mergedSpaces });
      }

      toast.success('Bookmarks imported and merged successfully');
    } catch (error) {
      console.error('Error importing bookmarks from file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import bookmarks');
      throw error;
    }
  };

  const handleExportBookmarks = async (settings: AppSettings): Promise<void> => {
    try {
      const exportData: BookmarkExport = {
        version: '1.0',
        spaces,
        settings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Bookmarks exported successfully');
    } catch (error) {
      console.error('Error exporting bookmarks:', error);
      toast.error('Failed to export bookmarks');
      throw error;
    }
  };

  return {
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    handleCreateSpace,
    handleUpdateSpace,
    handleDeleteSpace,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAddBookmark,
    handleUpdateBookmark,
    handleDeleteBookmark,
    handleImportChromeBookmarks,
    handleExportBookmarks,
    handleImportBookmarksFromFile,
  };
}
