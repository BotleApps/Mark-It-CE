import { useState, useEffect, useCallback } from 'react';
import type { OpenTab, Space } from '../types';

// More test data for development
const testTabs: OpenTab[] = [
  {
    id: 1,
    title: 'React Documentation',
    url: 'https://react.dev',
  },
  {
    id: 2,
    title: 'TypeScript Documentation',
    url: 'https://www.typescriptlang.org/docs/',
  },
  {
    id: 3,
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
  },
  {
    id: 4,
    title: 'GitHub',
    url: 'https://github.com',
  },
  {
    id: 5,
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
  }
];

export function useOpenTabs(activeSpace: Space) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [savedTabIds, setSavedTabIds] = useState<Set<number>>(new Set());

  // Get all bookmarked URLs in the current space
  const getBookmarkedUrls = useCallback(() => {
    const urls = new Set<string>();
    activeSpace.groups.forEach(group => {
      group.bookmarks.forEach(bookmark => {
        urls.add(bookmark.url);
      });
    });
    return urls;
  }, [activeSpace]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const bookmarkedUrls = getBookmarkedUrls();
        const filteredTabs: OpenTab[] = tabs
          .filter(tab => 
            tab.url && 
            !tab.url.startsWith('chrome://') && 
            !savedTabIds.has(tab.id || 0) &&
            !bookmarkedUrls.has(tab.url) // Filter out already bookmarked URLs
          )
          .map(tab => ({
            id: tab.id || 0,
            title: tab.title || '',
            url: tab.url || '',
          }));
        setOpenTabs(filteredTabs);
      });
    } else {
      // Development fallback with test data
      const bookmarkedUrls = getBookmarkedUrls();
      const filteredTestTabs = testTabs.filter(tab => 
        !savedTabIds.has(tab.id) && 
        !bookmarkedUrls.has(tab.url)
      );
      setOpenTabs(filteredTestTabs);
    }
  }, [savedTabIds, getBookmarkedUrls]);

  const handleBookmarkTab = useCallback(async (tab: OpenTab, groupId: string) => {
    setSavedTabIds(prev => new Set([...prev, tab.id]));
    setOpenTabs(prev => prev.filter(t => t.id !== tab.id));

    return {
      title: tab.title,
      url: tab.url,
      createdAt: new Date().toISOString(),
    };
  }, []);

  return {
    openTabs,
    handleBookmarkTab,
  };
}
