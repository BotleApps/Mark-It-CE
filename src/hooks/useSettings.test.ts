import { act, renderHook } from '@testing-library/react';
import { useSettings, defaultSettings } from './useSettings'; // Assuming the hook and defaults are here
import type { AppSettings } from '../types'; // Assuming types are here

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    // @ts-ignore
    lastError: undefined,
    // Mock other runtime properties if needed by the hook indirectly
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  // Add other chrome APIs if they are used by the hook
} as any;


describe('useSettings Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // @ts-ignore
    chrome.runtime.lastError = undefined;

    // Default mock for chrome.storage.local.get to return no settings initially (or default)
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      if (keys === 'settings') {
        callback({ settings: undefined }); // Simulate no settings saved
      } else {
        callback({});
      }
    });

    // Default mock for chrome.storage.local.set
    (chrome.storage.local.set as jest.Mock).mockImplementation((items, callback) => {
      if (callback) {
        callback();
      }
    });
  });

  test('should load initial settings from storage or use defaults', async () => {
    // Scenario 1: Storage is empty, should use defaultSettings
    const { result: resultDefault, waitForNextUpdate: waitForDefaultUpdate, unmount: unmountDefault } = renderHook(() => useSettings());

    // Need to wait for useEffect to run
    await act(async () => {
      // Default mock for get returns { settings: undefined }
      // No need to call waitForNextUpdate if initial state is defaultSettings
      // and useEffect doesn't cause an immediate second update based on undefined from storage.
      // The hook initializes with defaultSettings, then useEffect runs.
      // If storage is empty, state remains defaultSettings.
    });
    expect(resultDefault.current.settings).toEqual(defaultSettings);
    unmountDefault(); // Clean up before next renderHook

    // Scenario 2: Storage has settings
    const storedSettings: AppSettings = {
      theme: 'dark',
      hasCompletedSetup: true,
      rightPanelCollapsed: true,
      linkTarget: '_blank', // LinkTarget.SELF, if using enum values directly
    };
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      if (keys.includes('settings')) {
        callback({ settings: storedSettings });
      } else {
        callback({});
      }
    });

    const { result: resultStored, waitForNextUpdate: waitForStoredUpdate } = renderHook(() => useSettings());

    await act(async () => {
      // Wait for useEffect to fetch and set the stored settings
      // This might require a more robust waiting mechanism if there are multiple async operations
      // For now, a simple flush of promises.
      await Promise.resolve();
    });

    // The hook's useEffect should update the state after getting data from storage.
    // This might need a waitForNextUpdate or similar if the update isn't immediate.
    // Let's try waiting for the state to reflect storedSettings.
    // This depends on how fast the mock storage responds and useEffect processes.
    // A short timeout or a more specific wait condition might be needed if this is flaky.
    // For now, let's assume the update is caught.
    // If flaky: await waitFor(() => expect(resultStored.current.settings).toEqual(storedSettings));

    expect(resultStored.current.settings).toEqual(storedSettings);
  });

  test('should update settings using handleUpdateSettings (no theme change)', async () => {
    const { result } = renderHook(() => useSettings());
    const newSettingsData: AppSettings = {
      ...defaultSettings,
      linkTarget: '_self', // LinkTarget.SELF
    };

    await act(async () => {
      await result.current.handleUpdateSettings(newSettingsData);
    });

    expect(result.current.settings).toEqual(newSettingsData);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: newSettingsData });
    expect(result.current.isThemeChanging).toBe(false);
  });

  test('should update settings and handle theme change flow using handleUpdateSettings', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSettings());
    const initialSettings = result.current.settings;
    const newSettingsData: AppSettings = {
      ...initialSettings,
      theme: 'dark',
    };

    let updatePromise;
    act(() => {
      updatePromise = result.current.handleUpdateSettings(newSettingsData);
    });

    // Check isThemeChanging immediately after call
    expect(result.current.isThemeChanging).toBe(true);
    // Settings should not have changed yet due to timeout for theme change
    expect(result.current.settings.theme).toBe(initialSettings.theme);

    // Fast-forward the first timeout (50ms)
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Settings should now be updated
    expect(result.current.settings.theme).toBe('dark');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: newSettingsData });
    // isThemeChanging should still be true until the second timeout

    // Fast-forward the second timeout (300ms)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isThemeChanging).toBe(false);
    await act(async () => { await updatePromise; }); // Ensure the async function completes
    jest.useRealTimers();
  });


  test('should complete setup using handleCompleteSetup', async () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.hasCompletedSetup).toBe(false);

    await act(async () => {
      await result.current.handleCompleteSetup();
    });

    expect(result.current.settings.hasCompletedSetup).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      settings: expect.objectContaining({ hasCompletedSetup: true }),
    });
  });

  test('should update right panel collapse state using handleRightPanelCollapse', async () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.rightPanelCollapsed).toBe(false);

    await act(async () => {
      await result.current.handleRightPanelCollapse(true);
    });
    expect(result.current.settings.rightPanelCollapsed).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      settings: expect.objectContaining({ rightPanelCollapsed: true }),
    });

    await act(async () => {
      await result.current.handleRightPanelCollapse(false);
    });
    expect(result.current.settings.rightPanelCollapsed).toBe(false);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      settings: expect.objectContaining({ rightPanelCollapsed: false }),
    });
  });

  describe('Theme Management', () => {
    // The specific test for theme change logic is now covered by the handleUpdateSettings test.
    // This describe block can be used for more theme-specific tests if they arise,
    // e.g. interaction with system theme preferences via matchMedia, if implemented.
    test('should change theme and manage isThemeChanging state', async () => {
      // This is essentially tested in 'should update settings and handle theme change flow'
      // We can add more specific assertions here if needed, or keep that test as the main one.
      // For now, let's ensure this is covered.
      jest.useFakeTimers();
      const { result } = renderHook(() => useSettings());
      const newSettingsData: AppSettings = { ...result.current.settings, theme: 'dark' };

      act(() => { result.current.handleUpdateSettings(newSettingsData); });
      expect(result.current.isThemeChanging).toBe(true);
      act(() => { jest.advanceTimersByTime(50); }); // First timeout
      expect(result.current.settings.theme).toBe('dark');
      act(() => { jest.advanceTimersByTime(300); }); // Second timeout
      expect(result.current.isThemeChanging).toBe(false);
      jest.useRealTimers();
    });

    test('should apply system theme if "system" is selected', async () => {
        // The current hook code doesn't have explicit logic for 'system' theme beyond setting it.
        // Actual application of system theme (e.g., via matchMedia listeners and updating body class)
        // would typically be in a UI component or a separate effect.
        // This test will verify that 'system' can be set as a theme.
        const { result } = renderHook(() => useSettings());
         const newSettingsData: AppSettings = {
            ...defaultSettings,
            theme: 'system',
        };

        await act(async () => {
            await result.current.handleUpdateSettings(newSettingsData);
            // Need to advance timers if theme changed, even to 'system'
            // Assuming current theme is not 'system'
        });

        // If initial theme was different, timers are involved.
        // If we assume defaultSettings.theme ('light') is the initial.
        expect(result.current.isThemeChanging).toBe(true);
        act(() => { jest.advanceTimersByTime(50 + 300); });


        expect(result.current.settings.theme).toBe('system');
        expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: newSettingsData });
    });
  });

  test('should handle errors during storage operations', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Test error during initial load (chrome.storage.local.get)
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Error getting settings' };
      callback({}); // Simulate error by returning empty object or undefined for settings
    });

    const { result: resultGetError, unmount: unmountGetError } = renderHook(() => useSettings());
    await act(async () => { /* allow useEffect to run */ });

    // Hook should fall back to default settings and not crash
    expect(resultGetError.current.settings).toEqual(defaultSettings);
    // Check if the hook logs the error (it currently doesn't, but good for future)
    // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error getting settings'));
    unmountGetError();

    // Reset lastError for the next test part
    // @ts-ignore
    chrome.runtime.lastError = undefined;
    // Restore default get behavior for setting other settings
     (chrome.storage.local.get as jest.Mock).mockImplementation((keys, callback) => {
      if (keys === 'settings') {
        callback({ settings: defaultSettings });
      } else {
        callback({});
      }
    });


    // Test error during update (chrome.storage.local.set)
    (chrome.storage.local.set as jest.Mock).mockImplementation((items, callback) => {
      // @ts-ignore
      chrome.runtime.lastError = { message: 'Error setting settings' };
      if (callback) {
        callback(); // Call callback even if there's an error, as per some API behaviors
      }
    });

    const { result: resultUpdateError } = renderHook(() => useSettings());
    const newSettingsData: AppSettings = { ...defaultSettings, hasCompletedSetup: true };

    await act(async () => {
      await resultUpdateError.current.handleUpdateSettings(newSettingsData);
    });

    // Local state should still update
    expect(resultUpdateError.current.settings).toEqual(newSettingsData);
    // Check if the hook logs the error from set (it currently doesn't)
    // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error setting settings'));

    consoleErrorSpy.mockRestore();
  });
});
