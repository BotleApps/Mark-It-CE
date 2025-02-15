import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { SpaceSidebar } from '../components/SpaceSidebar';
import type { Space } from '../types';

interface MainLayoutProps {
  spaces: Space[];
  activeSpaceId: string;
  activeSpace: Space;
  onSpaceSelect: (spaceId: string) => void;
  onCreateSpace: () => void;
  onEditSpace: (space: Space) => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}

export function MainLayout({
  spaces,
  activeSpaceId,
  activeSpace,
  onSpaceSelect,
  onCreateSpace,
  onEditSpace,
  onOpenSettings,
  theme,
  children,
}: MainLayoutProps) {
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`} style={{ position: 'relative', zIndex: 1 }}>
      <div className="flex min-h-screen">
        <div className={`w-20 flex flex-col border-r relative ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <SpaceSidebar
            spaces={spaces}
            activeSpaceId={activeSpaceId}
            onSpaceSelect={onSpaceSelect}
            onCreateSpace={onCreateSpace}
            onEditSpace={onEditSpace}
            theme={theme}
          />

          <button
            onClick={onOpenSettings}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 text-gray-400 hover:text-blue-400'
                : 'bg-gray-100 text-gray-600 hover:text-blue-600'
            }`}
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
