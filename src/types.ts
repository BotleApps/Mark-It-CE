export interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface BookmarkGroup {
  id: string;
  name: string;
  color: string;
  bookmarks: Bookmark[];
  isExpanded: boolean;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  groups: BookmarkGroup[];
}

export interface OpenTab {
  id: number;
  title: string;
  url: string;
}

export enum LinkTarget {
  NEW = '_blank',
  CURRENT = '_self',
}

export interface AppSettings {
  theme: 'light' | 'dark';
  hasCompletedSetup: boolean;
  rightPanelCollapsed: boolean;
  linkTarget:  LinkTarget;
}

export interface BookmarkExport {
  version: string;
  spaces: Space[];
  settings: AppSettings;
  exportDate: string;
}

export interface ChromeBookmarkFolder {
  id: string;
  title: string;
  children?: chrome.bookmarks.BookmarkTreeNode[];
  selected?: boolean;
}
