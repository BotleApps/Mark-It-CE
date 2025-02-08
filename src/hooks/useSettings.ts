import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  theme: 'light',
  hasCompletedSetup: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Load settings and last active space
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['settings', 'lastActiveSpace'], (result) => {
        if (result.settings) {
          setSettings(result.settings);
        }
      });
    }
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    if (newSettings.theme !== settings.theme) {
      setIsThemeChanging(true);
      setTimeout(() => {
        setSettings(newSettings);
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ settings: newSettings });
        }
        setTimeout(() => {
          setIsThemeChanging(false);
        }, 300);
      }, 50);
    } else {
      setSettings(newSettings);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ settings: newSettings });
      }
    }
  };

  const handleCompleteSetup = async () => {
    const newSettings = { ...settings, hasCompletedSetup: true };
    setSettings(newSettings);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ settings: newSettings });
    }
  };

  return {
    settings,
    isThemeChanging,
    handleUpdateSettings,
    handleCompleteSetup,
  };
}
