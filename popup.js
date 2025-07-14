// Canvas Grade Tracker Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});

async function initializePopup() {
  // Check if current tab is a Canvas page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isCanvasPage = tab.url.includes('instructure.com') || tab.url.includes('canvas');
  
  updateStatus(isCanvasPage);
  
  // Load settings
  await loadSettings();
}

function updateStatus(isActive) {
  const statusElement = document.getElementById('status');
  const openCanvasBtn = document.getElementById('openCanvas');
  const refreshBtn = document.getElementById('refreshData');
  
  if (isActive) {
    statusElement.className = 'status active';
    statusElement.innerHTML = `
      <div class="status-icon"></div>
      <span>Canvas Grade Tracker is active</span>
    `;
    openCanvasBtn.textContent = 'Refresh Grades';
    refreshBtn.style.display = 'block';
  } else {
    statusElement.className = 'status inactive';
    statusElement.innerHTML = `
      <div class="status-icon"></div>
      <span>Navigate to a Canvas course to activate</span>
    `;
    openCanvasBtn.textContent = 'Open Canvas';
    refreshBtn.style.display = 'none';
  }
}

async function loadSettings() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, resolve);
    });
    
    if (response.success) {
      const settings = response.settings;
      
      // Update toggles
      updateToggle('autoRefreshToggle', settings.autoRefresh);
      updateToggle('notificationsToggle', settings.showNotifications);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function updateToggle(toggleId, isActive) {
  const toggle = document.getElementById(toggleId);
  if (isActive) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

function setupEventListeners() {
  // Open Canvas button
  document.getElementById('openCanvas').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isCanvasPage = tab.url.includes('instructure.com') || tab.url.includes('canvas');
    
    if (isCanvasPage) {
      // Refresh grades on current tab
      chrome.tabs.sendMessage(tab.id, { action: 'refreshGrades' });
      window.close();
    } else {
      // Open a new Canvas tab (you might want to customize this URL)
      chrome.tabs.create({ url: 'https://canvas.instructure.com' });
      window.close();
    }
  });
  
  // Refresh data button
  document.getElementById('refreshData').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'refreshGrades' });
    window.close();
  });
  
  // Auto-refresh toggle
  document.getElementById('autoRefreshToggle').addEventListener('click', async (e) => {
    const toggle = e.target;
    const isActive = !toggle.classList.contains('active');
    
    updateToggle('autoRefreshToggle', isActive);
    
    await updateSetting('autoRefresh', isActive);
  });
  
  // Notifications toggle
  document.getElementById('notificationsToggle').addEventListener('click', async (e) => {
    const toggle = e.target;
    const isActive = !toggle.classList.contains('active');
    
    updateToggle('notificationsToggle', isActive);
    
    await updateSetting('showNotifications', isActive);
  });
  
  // Support link
  document.getElementById('supportLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/yourusername/canvas-grade-tracker' });
  });
}

async function updateSetting(key, value) {
  try {
    const settings = {};
    settings[key] = value;
    
    await new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: settings 
      }, resolve);
    });
  } catch (error) {
    console.error('Error updating setting:', error);
  }
}

// Listen for tab updates to refresh status
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id === tabId && changeInfo.status === 'complete') {
      const isCanvasPage = tab.url.includes('instructure.com') || tab.url.includes('canvas');
      updateStatus(isCanvasPage);
    }
  });
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    updateStatus(request.isActive);
  }
});