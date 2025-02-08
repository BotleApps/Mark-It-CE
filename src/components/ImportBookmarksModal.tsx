import React, { useState, useEffect } from 'react';
import { X, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import type { ChromeBookmarkFolder } from '../types';

interface ImportBookmarksModalProps {
  onClose: () => void;
  onImport: (folderIds: string[]) => void;
  theme: 'light' | 'dark';
}

interface FolderNode extends ChromeBookmarkFolder {
  isExpanded?: boolean;
  level: number;
  selected?: boolean;
  children: FolderNode[];
}

export function ImportBookmarksModal({ onClose, onImport, theme }: ImportBookmarksModalProps) {
  const [loading, setLoading] = useState(true);
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getTree(async (bookmarkTreeNodes) => {
        const roots = bookmarkTreeNodes[0].children || [];
        const folders = await Promise.all(roots.map(async node => {
          const subfolders = await getSubfolders(node, 0);
          return {
            id: node.id,
            title: node.title,
            children: subfolders,
            level: 0,
            isExpanded: false,
            selected: false
          };
        }));
        setRootFolders(folders);
        setLoading(false);
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
              children: [
                {
                  id: '111',
                  title: 'React',
                  children: [],
                  level: 2,
                  selected: false
                },
                {
                  id: '112',
                  title: 'TypeScript',
                  children: [],
                  level: 2,
                  selected: false
                }
              ],
              level: 1,
              selected: false
            }
          ],
          level: 0,
          selected: false
        }
      ]);
      setLoading(false);
    }
  }, []);

  const getSubfolders = async (node: chrome.bookmarks.BookmarkTreeNode, level: number): Promise<FolderNode[]> => {
    if (!node.children) return [];

    const folders = node.children.filter(child => !child.url);
    return Promise.all(folders.map(async folder => {
      const subfolders = await getSubfolders(folder, level + 1);
      return {
        id: folder.id,
        title: folder.title,
        children: subfolders,
        level: level + 1,
        isExpanded: false,
        selected: false
      };
    }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const updateFolderSelection = (folders: FolderNode[], folderId: string, selected: boolean): FolderNode[] => {
    return folders.map(folder => {
      if (folder.id === folderId) {
        // Update this folder and all its children
        const updatedFolder = {
          ...folder,
          selected,
          children: folder.children.map(child => ({
            ...child,
            selected
          }))
        };
        
        // Update selectedFolders state
        if (selected) {
          setSelectedFolders(prev => [...prev, folder.id, ...folder.children.map(c => c.id)]);
        } else {
          setSelectedFolders(prev => prev.filter(id => id !== folder.id && !folder.children.map(c => c.id).includes(id)));
        }
        
        return updatedFolder;
      }
      
      if (folder.children.length > 0) {
        return {
          ...folder,
          children: updateFolderSelection(folder.children, folderId, selected)
        };
      }
      
      return folder;
    });
  };

  const handleToggleFolder = (folderId: string) => {
    const folder = findFolder(rootFolders, folderId);
    if (folder) {
      const newSelected = !folder.selected;
      setRootFolders(prev => updateFolderSelection(prev, folderId, newSelected));
    }
  };

  const findFolder = (folders: FolderNode[], id: string): FolderNode | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.children.length > 0) {
        const found = findFolder(folder.children, id);
        if (found) return found;
      }
    }
    return null;
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
              checked={folder.selected}
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={`w-[500px] p-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-center">
            <Loader2 className={`w-8 h-8 animate-spin ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
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
            Import Chrome Bookmarks
          </h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto mb-6">
          {rootFolders.map(folder => renderFolder(folder))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(selectedFolders)}
            disabled={selectedFolders.length === 0}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
              selectedFolders.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-600'
            }`}
          >
            Import Selected
          </button>
        </div>
      </div>
    </div>
  );
}
