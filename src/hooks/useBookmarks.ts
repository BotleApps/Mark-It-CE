import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Space, BookmarkGroup, Bookmark, BookmarkExport } from '../types';

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
  const [spaces, setSpaces] = useState<Space[]>([defaultSpace]);
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
      const listener = (message: any) => {
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

      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        await chrome.bookmarks.removeTree(groupId);
      }
    }
  }, [spaces]);

  const handleAddBookmark = useCallback(async (spaceId: string, groupId: string, bookmark: Omit<Bookmark, 'id'>) => {
    let newBookmarkId = generateUniqueId('bookmark');

    // If Chrome bookmarks API is available, create the bookmark there first
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      try {
        const chromeBookmark = await chrome.bookmarks.create({
          parentId: groupId,
          title: bookmark.title,
          url: bookmark.url
        });
        newBookmarkId = chromeBookmark.id;
      } catch (error) {
        console.error('Failed to create Chrome bookmark:', error);
      }
    }

    const newBookmark: Bookmark = {
      ...bookmark,
      id: newBookmarkId,
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

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      try {
        await chrome.bookmarks.update(updatedBookmark.id, {
          title: updatedBookmark.title,
          url: updatedBookmark.url
        });
      } catch (error) {
        console.error('Failed to update Chrome bookmark:', error);
      }
    }
  }, [spaces]);

  const handleDeleteBookmark = useCallback(async (spaceId: string, groupId: string, bookmarkId: string) => {
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

    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      try {
        await chrome.bookmarks.remove(bookmarkId);
      } catch (error) {
        console.error('Failed to delete Chrome bookmark:', error);
      }
    }
  }, [spaces]);

  const handleImportChromeBookmarks = async (folderIds: string[], spaceId: string) => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      console.warn('Chrome bookmarks API not available');
      return;
    }

    try {
      for (const folderId of folderIds) {
        const folder = await new Promise<chrome.bookmarks.BookmarkTreeNode>((resolve) => {
          chrome.bookmarks.getSubTree(folderId, ([result]) => resolve(result));
        });

        if (folder) {
          // Create a new group for each folder
          const group: BookmarkGroup = {
            id: generateUniqueId('group'),
            name: folder.title,
            color: '#3B82F6', // Default blue color
            bookmarks: [],
            isExpanded: true,
          };

          // Add all bookmarks from the folder
          const bookmarks: Bookmark[] = [];
          if (folder.children) {
            for (const child of folder.children) {
              if (child.url) {
                bookmarks.push({
                  id: generateUniqueId('bookmark'),
                  title: child.title,
                  url: child.url,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }

          group.bookmarks = bookmarks;

          // Add the group to the current space
          const newSpaces = spaces.map(space => 
            space.id === spaceId
              ? { ...space, groups: [...space.groups, group] }
              : space
          );

          setSpaces(newSpaces);
          if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ spaces: newSpaces });
          }
        }
      }
    } catch (error) {
      console.error('Error importing Chrome bookmarks:', error);
      throw error;
    }
  };

  const handleImportBookmarksFromFile = async (importData: unknown): Promise<void> => {
    try {
      // Type guard function to validate BookmarkExport
      const isBookmarkExport = (data: any): data is BookmarkExport => {
        return (
          data &&
          typeof data === 'object' &&
          'version' in data &&
          'spaces' in data &&
          Array.isArray(data.spaces) &&
          data.spaces.every((space: any) =>
            space &&
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

      setSpaces(importData.spaces);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ spaces: importData.spaces });
      }

      toast.success('Bookmarks imported successfully');
    } catch (error) {
      console.error('Error importing bookmarks from file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import bookmarks');
      throw error;
    }
  };

  const handleExportBookmarks = async (): Promise<void> => {
    try {
      const exportData: BookmarkExport = {
        version: '1.0',
        spaces,
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
