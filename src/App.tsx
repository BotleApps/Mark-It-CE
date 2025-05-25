import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Settings as SettingsIcon, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { Toaster } from 'react-hot-toast';
import { DragProvider } from './contexts/DragContext';
import { MainLayout } from './layouts/MainLayout';
import { BookmarkGroup } from './components/BookmarkGroup';
import { OpenTabsList } from './components/OpenTabsList';
import { GroupSettingsModal } from './components/GroupSettingsModal';
import { BookmarkEditModal } from './components/BookmarkEditModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CreateSpaceModal } from './components/CreateSpaceModal';
import { SettingsModal } from './components/SettingsModal';
import { FirstTimeSetup } from './components/FirstTimeSetup';
import { ImportBookmarksModal } from './components/ImportBookmarksModal';
import { SpaceSettingsModal } from './components/SpaceSettingsModal';
import { useBookmarks } from './hooks/useBookmarks';
import { useOpenTabs } from './hooks/useOpenTabs';
import { useSettings } from './hooks/useSettings';
import { useDragHandlers } from './hooks/useDragHandlers';
import type { Bookmark, Space, BookmarkGroup as BookmarkGroupType } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGroup, setEditingGroup] = useState<BookmarkGroupType | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportingBookmarks, setIsImportingBookmarks] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState<boolean>(false);

  const {
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
  } = useBookmarks();

  const activeSpace = useMemo(() =>
    spaces.find(space => space.id === activeSpaceId) || spaces[0],
    [spaces, activeSpaceId]
  );

  const {
    openTabs,
    handleBookmarkTab,
  } = useOpenTabs(activeSpace);

  const {
    settings,
    isThemeChanging,
    handleUpdateSettings,
    handleCompleteSetup,
    handleRightPanelCollapse,
  } = useSettings();

  const dragHandlers = useDragHandlers(
    activeSpace,
    async (tab, groupId) => {
      try {
        const bookmarkData = await handleBookmarkTab(tab, groupId);
        await handleAddBookmark(activeSpace.id, groupId, bookmarkData);
      } catch (error) {
        console.error('Failed to create bookmark:', error);
      }
    }
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return activeSpace.groups;

    const query = searchQuery.toLowerCase();
    return activeSpace.groups.reduce<BookmarkGroupType[]>((acc, group) => {
      const filteredBookmarks = group.bookmarks.filter(
        bookmark =>
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query)
      );

      if (filteredBookmarks.length > 0) {
        acc.push({
          ...group,
          bookmarks: filteredBookmarks
        });
      }
      return acc;
    }, []);
  }, [activeSpace.groups, searchQuery]);

  const handleMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const groupIndex = activeSpace.groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const newGroups = [...activeSpace.groups];
    const newIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;

    if (newIndex >= 0 && newIndex < newGroups.length) {
      [newGroups[groupIndex], newGroups[newIndex]] = [newGroups[newIndex], newGroups[groupIndex]];

      handleUpdateSpace({
        ...activeSpace,
        groups: newGroups,
      });
    }
  };

  useEffect(() => {
    setRightPanelCollapsed(settings.rightPanelCollapsed);
  }, [settings.rightPanelCollapsed]);

  const toggleRightPanel = () => {
    setRightPanelCollapsed((rightPanelCollapsed) => {
      handleRightPanelCollapse(!rightPanelCollapsed);
      return !rightPanelCollapsed;
    });
  }

  return (
    <DndContext
      onDragStart={dragHandlers.handleDragStart}
      onDragOver={dragHandlers.handleDragOver}
      onDragEnd={dragHandlers.handleDragEnd}
      collisionDetection={closestCenter}
      style={{ zIndex: 200 }} // Higher z-index for DndContext
    >
      <MainLayout
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        activeSpace={activeSpace}
        onSpaceSelect={setActiveSpaceId}
        onCreateSpace={() => setIsCreatingSpace(true)}
        onEditSpace={setEditingSpace}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={settings.theme}
      >
        <div className="p-4 flex gap-8 flex-1">
          {/* Middle Panel: Header and Bookmark Groups */}
          <div className="flex-1 flex flex-col overflow-y-auto" style={{ position: 'relative' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className={`text-2xl font-bold ${settings.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {activeSpace.name}
                </h1>
                <button
                  onClick={() => setEditingSpace(activeSpace)}
                  className={`p-2 rounded-lg border ${settings.theme === 'dark'
                    ? 'border-gray-700 hover:border-blue-500 text-gray-300'
                    : 'border-gray-300 hover:border-blue-500 text-gray-700'
                    }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow flex items-center justify-center">
                <div className="relative w-full max-w-[500px]">
                  <input
                    type="text"
                    placeholder="Search for bookmarks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-5 pr-10 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${settings.theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900'
                      }`}
                  />
                  <Search
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                  />
                </div>
              </div>

              <button
                onClick={() => setIsCreatingGroup(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors`}
              >
                <Plus className="w-5 h-5" />
                Create Group
              </button>
            </div>

            <div className="">
            <div className="space-y-6 flex-1 overflow-y-auto bookmark-groups-container" style={{ maxHeight: '90vh' }}>
              {filteredGroups.map((group, index) => (
                <BookmarkGroup
                  key={group.id}
                  group={group}
                  onEditBookmark={setEditingBookmark}
                  onDeleteBookmark={(bookmarkId) => handleDeleteBookmark(activeSpace.id, group.id, bookmarkId)}
                  onEditGroup={setEditingGroup}
                  onUpdateGroup={(updatedGroup) => handleUpdateGroup(activeSpace.id, updatedGroup)}
                  onDeleteGroup={() => handleDeleteGroup(activeSpace.id, group.id)}
                  onHandleMoveGroup={(direction) => handleMoveGroup(group.id, direction)}
                  isFirst={index === 0}
                  isLast={index === filteredGroups.length - 1}
                  theme={settings.theme}
                  spaceId={activeSpace.id}
                  onAddBookmark={handleAddBookmark}
                />
              ))}
            </div>
            </div>
          </div>

          {/* Right Panel: Open Tabs */}
          {
            rightPanelCollapsed ?
                <div className="flex flex-col items-start">
                  <button
                      onClick={toggleRightPanel}
                      className={`p-2 rounded-full transition-colors ${
                          settings.theme === 'dark'
                              ? 'bg-gray-800 text-gray-400 hover:text-blue-400'
                              : 'bg-gray-100 text-gray-600 hover:text-blue-600'
                      }`}
                  >
                    <ArrowLeftToLine className="w-4 h-4" />
                  </button>
                  <p
                    onClick={toggleRightPanel}
                    className={`mt-1 p-1 text-base cursor-pointer [writing-mode:vertical-lr] ${
                      settings.theme === "dark"
                          ? 'text-gray-400'
                          : 'text-gray-600'}`
                    }> Open Tabs ({openTabs.length})
                  </p>
                </div>
                :
                <div className="w-80 flex-shrink-0 flex flex-col overflow-y-auto">
                  <p className={`mb-2 text-sm p-2 rounded-md border ${settings.theme === 'dark'
                      ? 'bg-blue-900/50 border-blue-500/50 text-blue-300'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    Drag and drop tabs onto a group or over and click on + button to bookmark them.
                  </p>
                  <div className="flex flex-row">
                    <h2 className={`text-lg font-bold mb-4 ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Open Tabs
                    </h2>
                    <button
                        onClick={toggleRightPanel}
                        className={`ml-auto p-2 rounded-full transition-colors mb-4 ${
                            settings.theme === 'dark'
                                ? 'bg-gray-800 text-gray-400 hover:text-blue-400'
                                : 'bg-gray-100 text-gray-600 hover:text-blue-600'
                        }`}
                    >
                      <ArrowRightToLine className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="open-tabs-container overflow-y-auto" style={{ maxHeight: '85vh' }}>
                    <OpenTabsList
                        tabs={openTabs}
                        groups={activeSpace.groups}
                        onBookmarkTab={handleBookmarkTab}
                        theme={settings.theme}
                    />
                  </div>
                </div>
          }
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: settings.theme === 'dark' ? '#374151' : '#ffffff',
              color: settings.theme === 'dark' ? '#ffffff' : '#000000',
            },
          }}
        />

        {!settings.hasCompletedSetup && (
          <FirstTimeSetup
            onComplete={async (folderIds) => {
              await handleImportChromeBookmarks(folderIds, activeSpace.id);
              handleCompleteSetup();
            }}
            onSkip={handleCompleteSetup}
            theme={settings.theme}
          />
        )}

        {isImportingBookmarks && (
          <ImportBookmarksModal
            onClose={() => setIsImportingBookmarks(false)}
            onImport={async (folderIds) => {
              await handleImportChromeBookmarks(folderIds, activeSpace.id);
              setIsImportingBookmarks(false);
            }}
            theme={settings.theme}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleUpdateSettings}
            onImportBookmarks={() => {
              setIsSettingsOpen(false);
              setIsImportingBookmarks(true);
            }}
            onExportBookmarks={handleExportBookmarks}
            handleImportBookmarksFromFile={handleImportBookmarksFromFile}
            theme={settings.theme}
            isThemeChanging={isThemeChanging}
          />
        )}

        {isCreatingSpace && (
          <CreateSpaceModal
            onClose={() => setIsCreatingSpace(false)}
            onSave={async (newSpace) => {
              await handleCreateSpace(newSpace);
              setIsCreatingSpace(false);
            }}
            theme={settings.theme}
          />
        )}

        {editingSpace && (
          <SpaceSettingsModal
            space={editingSpace}
            onClose={() => setEditingSpace(null)}
            onSave={async (updatedSpace) => {
              await handleUpdateSpace(updatedSpace);
              setEditingSpace(null);
            }}
            onDelete={() => handleDeleteSpace(editingSpace.id)}
            theme={settings.theme}
            spaces={spaces}
          />
        )}

        {isCreatingGroup && (
          <CreateGroupModal
            onClose={() => setIsCreatingGroup(false)}
            onSave={async (newGroup) => {
              await handleCreateGroup(activeSpace.id, newGroup);
              setIsCreatingGroup(false);
            }}
            theme={settings.theme}
          />
        )}

        {editingGroup && (
          <GroupSettingsModal
            group={editingGroup}
            onClose={() => setEditingGroup(null)}
            onSave={async (updatedGroup) => {
              await handleUpdateGroup(activeSpace.id, updatedGroup);
              setEditingGroup(null);
            }}
            theme={settings.theme}
          />
        )}

        {editingBookmark && (
          <BookmarkEditModal
            bookmark={editingBookmark}
            onClose={() => setEditingBookmark(null)}
            onSave={async (updatedBookmark) => {
              const group = activeSpace.groups.find(g =>
                g.bookmarks.some(b => b.id === updatedBookmark.id)
              );
              if (group) {
                await handleUpdateBookmark(activeSpace.id, group.id, updatedBookmark);
              }
              setEditingBookmark(null);
            }}
            theme={settings.theme}
          />
        )}
      </MainLayout>
    </DndContext>
  );
}

function AppWrapper() {
  return (
    <DragProvider>
      <App />
    </DragProvider>
  );
}

export default AppWrapper;
