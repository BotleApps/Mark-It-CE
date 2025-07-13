// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const spaceSelect = document.getElementById('space');
  const groupSelect = document.getElementById('group');
  const form = document.getElementById('bookmark-form');
  const saveBtn = document.getElementById('save-btn');
  const openManagerBtn = document.getElementById('open-manager');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');

  try {
    // Get current tab information
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    titleInput.value = tab.title;
    urlInput.value = tab.url;

    // Load spaces and groups from storage
    const { spaces } = await chrome.storage.local.get(['spaces']);
    
    if (!spaces || spaces.length === 0) {
      showError('No spaces found. Please create a space first in the main application.');
      return;
    }

    // Populate spaces dropdown
    spaces.forEach(space => {
      const option = document.createElement('option');
      option.value = space.id;
      option.textContent = space.name;
      spaceSelect.appendChild(option);
    });

    // Handle space selection change
    spaceSelect.addEventListener('change', () => {
      const selectedSpaceId = spaceSelect.value;
      groupSelect.innerHTML = '<option value="">Select a group...</option>';
      
      if (selectedSpaceId) {
        const selectedSpace = spaces.find(space => space.id === selectedSpaceId);
        if (selectedSpace && selectedSpace.groups) {
          selectedSpace.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            groupSelect.appendChild(option);
          });
        }
      }
    });

    // Auto-select first space if only one exists
    if (spaces.length === 1) {
      spaceSelect.value = spaces[0].id;
      spaceSelect.dispatchEvent(new Event('change'));
      
      // Auto-select first group if only one exists
      if (spaces[0].groups && spaces[0].groups.length === 1) {
        setTimeout(() => {
          groupSelect.value = spaces[0].groups[0].id;
        }, 100);
      }
    }

    loading.style.display = 'none';
    mainContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading popup:', error);
    showError('Failed to load bookmark manager data.');
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    const spaceId = spaceSelect.value;
    const groupId = groupSelect.value;

    if (!title || !url || !spaceId || !groupId) {
      showError('Please fill in all fields.');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      // Create bookmark object
      const bookmark = {
        id: Date.now().toString(),
        title,
        url,
        dateAdded: new Date().toISOString()
      };

      // Get current spaces data
      const { spaces } = await chrome.storage.local.get(['spaces']);
      const updatedSpaces = [...spaces];
      
      // Find the space and group to add the bookmark to
      const spaceIndex = updatedSpaces.findIndex(space => space.id === spaceId);
      const groupIndex = updatedSpaces[spaceIndex].groups.findIndex(group => group.id === groupId);
      
      // Add bookmark to the group
      updatedSpaces[spaceIndex].groups[groupIndex].bookmarks.push(bookmark);
      
      // Save updated spaces back to storage
      await chrome.storage.local.set({ spaces: updatedSpaces });
      
      showSuccess('Bookmark saved successfully!');
      
      // Reset form
      titleInput.value = '';
      spaceSelect.value = '';
      groupSelect.innerHTML = '<option value="">Select a group...</option>';
      
      // Close popup after 1.5 seconds
      setTimeout(() => {
        window.close();
      }, 1500);

    } catch (error) {
      console.error('Error saving bookmark:', error);
      showError('Failed to save bookmark. Please try again.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Bookmark';
    }
  });

  // Handle "Open Manager" button
  openManagerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
  });

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }
});
