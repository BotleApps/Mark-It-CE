import React, { useState, useRef } from 'react';
import { X, Moon, Sun, Download, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AppSettings, BookmarkExport } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  onImportBookmarks: () => void;
  onExportBookmarks: () => void;
  theme: 'light' | 'dark';
  isThemeChanging: boolean;
}

export function SettingsModal({ 
  settings, 
  onClose, 
  onSave, 
  onImportBookmarks,
  onExportBookmarks,
  theme,
  isThemeChanging
}: SettingsModalProps) {
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [isThemeButtonChanging, setIsThemeButtonChanging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentSettings);
    onClose(); // Close the modal after saving
  };

  const handleThemeToggle = () => {
    setIsThemeButtonChanging(true);
    const newTheme = currentSettings.theme === 'light' ? 'dark' : 'light';
    setCurrentSettings(prev => ({ ...prev, theme: newTheme }));
    
    toast.success(`Theme changed to ${newTheme} mode`, {
      style: {
        background: newTheme === 'dark' ? '#374151' : '#ffffff',
        color: newTheme === 'dark' ? '#ffffff' : '#000000',
      },
    });
    
    setTimeout(() => {
      setIsThemeButtonChanging(false);
    }, 300);
  };

  const handleImportClick = () => {
    setShowImportOptions(true);
  };

  const handleImportFromChrome = () => {
    setShowImportOptions(false);
    onClose();
    onImportBookmarks();
    toast.success('Chrome bookmarks imported successfully', {
      style: {
        background: theme === 'dark' ? '#374151' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
      },
    });
  };

  const handleImportFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      await handleImportBookmarksFromFile(importedData);
      setShowImportOptions(false);
      onClose();
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import bookmarks');
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-[500px] p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } ${isThemeChanging ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Settings
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Theme
                </span>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  disabled={isThemeButtonChanging}
                  className={`p-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-blue-500 text-gray-200'
                      : 'border-gray-200 hover:border-blue-500 text-gray-700'
                  }`}
                >
                  {isThemeButtonChanging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentSettings.theme === 'light' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              </label>
            </div>

            <div className={`border-t pt-6 ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-sm font-medium mb-4 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Bookmarks Management
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleImportClick}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-blue-500 text-gray-200'
                      : 'border-gray-300 hover:border-blue-500 text-gray-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Import Bookmarks
                </button>
                <button
                  type="button"
                  onClick={onExportBookmarks}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-blue-500 text-gray-200'
                      : 'border-gray-300 hover:border-blue-500 text-gray-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Export Bookmarks
                </button>
              </div>
            </div>
          </div>

          <div className={`flex justify-end gap-3 mt-6 pt-6 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              type="button"
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
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileImport}
        />

        {showImportOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className={`w-[400px] p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Import Bookmarks
                </h3>
                <button
                  onClick={() => setShowImportOptions(false)}
                  className={`p-1 rounded-full ${
                    theme === 'dark'
                      ? 'hover:bg-gray-700 text-gray-400'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleImportFromChrome}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:border-blue-500 text-gray-200'
                      : 'border-gray-200 hover:border-blue-500 text-gray-700'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Import from Chrome Bookmarks</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Import bookmarks directly from Chrome
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleImportFromFile}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-700 hover:border-blue-500 text-gray-200'
                      : 'border-gray-200 hover:border-blue-500 text-gray-700'
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <div className="text-left">
                    <h4 className="font-medium">Import from File</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Import from a previously exported file
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}