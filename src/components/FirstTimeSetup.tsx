import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import type { ChromeBookmarkFolder, Space, BookmarkGroup } from '../types';

interface FirstTimeSetupProps {
  onComplete: (folderIds: string[]) => void;
  onSkip: () => void;
  theme: 'light' | 'dark';
}

interface FolderNode extends ChromeBookmarkFolder {
  isExpanded?: boolean;
  level: number;
}

export function FirstTimeSetup({ onComplete, onSkip, theme }: FirstTimeSetupProps) {
  const [loading, setLoading] = useState(true);
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            const roots = bookmarkTreeNodes[0].children || [];
            const folders = roots.map(node => ({
              id: node.id,
              title: node.title,
              children: getSubfolders(node, 0),
              level: 0,
              isExpanded: false
            }));
            setRootFolders(folders);
          });
        } else {
          // Development fallback
          setRootFolders([
            { 
              id: '1',
              title: 'Bookmarks Bar',
              children: [
                {
                  id: '11',
                  title: 'Development',
                  children: [],
                  level: 1,
                  selected: false
                }
              ],
              level: 0,
              selected: false
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  const getSubfolders = (node: chrome.bookmarks.BookmarkTreeNode, level: number): FolderNode[] => {
    if (!node.children) return [];

    return node.children
      .filter(child => !child.url)
      .map(folder => ({
        id: folder.id,
        title: folder.title,
        children: getSubfolders(folder, level + 1),
        level: level + 1,
        isExpanded: false,
        selected: false
      }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleToggleFolder = (folderId: string) => {
    setSelectedFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId);
      }
      return [...prev, folderId];
    });
  };

  const handleImport = async () => {
    if (selectedFolders.length === 0) return;

    setImporting(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks && chrome.storage) {
        // Get current spaces and active space
        const result = await chrome.storage.local.get(['spaces', 'lastActiveSpace']);
        const currentSpaces: Space[] = result.spaces || [];
        const activeSpaceId = result.lastActiveSpace;

        if (!activeSpaceId) {
          throw new Error('No active space found');
        }

        // Process each selected folder
        for (const folderId of selectedFolders) {
          await new Promise<void>((resolve, reject) => {
            chrome.bookmarks.getSubTree(folderId, async (results) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }

              const folder = results[0];
              if (!folder) {
                resolve();
                return;
              }

              try {
                // Create a new group for the folder
                const group: BookmarkGroup = {
                  id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: folder.title,
                  color: '#3B82F6',
                  bookmarks: [],
                  isExpanded: true,
                };

                // Add bookmarks from the folder
                if (folder.children) {
                  for (const child of folder.children) {
                    if (child.url) {
                      group.bookmarks.push({
                        id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: child.title,
                        url: child.url,
                        createdAt: new Date().toISOString(),
                      });
                    }
                  }
                }

                // Update the active space with the new group
                const updatedSpaces = currentSpaces.map(space => 
                  space.id === activeSpaceId
                    ? { ...space, groups: [...space.groups, group] }
                    : space
                );

                await chrome.storage.local.set({ spaces: updatedSpaces });
                resolve();
              } catch (error) {
                reject(error);
              }
            });
          });
        }

        // Complete the setup
        onComplete(selectedFolders);
      } else {
        // Development mode - just complete
        onComplete(selectedFolders);
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      alert('Failed to import bookmarks. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const renderFolder = (folder: FolderNode) => {
    const isExpanded = expandedFolders.includes(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const paddingLeft = `${folder.level * 1.5}rem`;

    return (
      <div key={folder.id}>
        <div 
          className="flex items-center"
          style={{ paddingLeft }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleFolder(folder.id)}
              className={`p-1 rounded-full mr-1 ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <label className="flex items-center py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedFolders.includes(folder.id)}
              onChange={() => handleToggleFolder(folder.id)}
              className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''
              }`}
            />
            <span className={`ml-3 text-sm font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {folder.title}
            </span>
          </label>
        </div>
        {isExpanded && folder.children && (
          <div className="ml-2">
            {folder.children.map(child => renderFolder(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading || importing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`w-[500px] p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-center">
            <Loader2 className={`w-8 h-8 animate-spin ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className={`ml-3 ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {importing ? 'Importing bookmarks...' : 'Loading bookmarks...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-[500px] p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to Mark it!
          </h2>
          <button 
            onClick={onSkip}
            className={`p-1 rounded-full ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Would you like to import your existing Chrome bookmarks? You can select which folders to import:
        </p>

        <div className="max-h-[400px] overflow-y-auto mb-6">
          {rootFolders.map(folder => renderFolder(folder))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onSkip}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Skip
          </button>
          <button
            onClick={handleImport}
            disabled={selectedFolders.length === 0 || importing}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
              selectedFolders.length === 0 || importing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
          >
            {importing ? 'Importing...' : 'Import Selected'}
          </button>
        </div>
      </div>
    </div>
  );
}