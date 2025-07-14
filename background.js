// Canvas Grade Tracker Background Script
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Canvas Grade Tracker installed');
    
    // Set default settings
    chrome.storage.sync.set({
      autoRefresh: true,
      refreshInterval: 5, // minutes
      showNotifications: true,
      gradeThreshold: 90 // percentage
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a Canvas page
  if (tab.url.includes('instructure.com') || tab.url.includes('canvas')) {
    // Inject content script if not already present
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } else {
    // Show popup with message about Canvas
    chrome.action.setPopup({
      tabId: tab.id,
      popup: 'popup.html'
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchGrades') {
    handleGradeFetch(request, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'saveGrades') {
    handleGradeSave(request, sendResponse);
    return true;
  } else if (request.action === 'getSettings') {
    handleGetSettings(sendResponse);
    return true;
  } else if (request.action === 'updateSettings') {
    handleUpdateSettings(request, sendResponse);
    return true;
  }
});

async function handleGradeFetch(request, sendResponse) {
  try {
    const { courseId, userId } = request;
    
    // Try to fetch grades using Canvas API
    const grades = await fetchGradesFromCanvas(courseId, userId, request.tabId);
    
    sendResponse({ success: true, grades: grades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function fetchGradesFromCanvas(courseId, userId, tabId) {
  try {
    // Execute script in the content context to access Canvas API
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: async (courseId, userId) => {
        try {
          // Try multiple API endpoints
          const endpoints = [
            `/api/v1/courses/${courseId}/assignments`,
            `/api/v1/courses/${courseId}/students/submissions`,
            `/api/v1/courses/${courseId}/gradebook_history/feed`
          ];
          
          for (const endpoint of endpoints) {
            try {
              const response = await fetch(endpoint, {
                headers: {
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                return { success: true, data: data, endpoint: endpoint };
              }
            } catch (e) {
              console.log(`Failed to fetch from ${endpoint}:`, e);
            }
          }
          
          return { success: false, error: 'No accessible API endpoints' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      args: [courseId, userId]
    });
    
    if (results && results[0] && results[0].result.success) {
      return results[0].result.data;
    } else {
      throw new Error('Unable to fetch grades from Canvas API');
    }
  } catch (error) {
    console.error('Error in fetchGradesFromCanvas:', error);
    throw error;
  }
}

async function handleGradeSave(request, sendResponse) {
  try {
    const { courseId, grades, timestamp } = request;
    
    // Get existing data
    const result = await chrome.storage.local.get(['gradeHistory']);
    const gradeHistory = result.gradeHistory || {};
    
    // Initialize course history if it doesn't exist
    if (!gradeHistory[courseId]) {
      gradeHistory[courseId] = [];
    }
    
    // Add new grade data
    gradeHistory[courseId].push({
      timestamp: timestamp || Date.now(),
      grades: grades
    });
    
    // Keep only last 50 entries per course
    if (gradeHistory[courseId].length > 50) {
      gradeHistory[courseId] = gradeHistory[courseId].slice(-50);
    }
    
    // Save back to storage
    await chrome.storage.local.set({ gradeHistory: gradeHistory });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving grades:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'autoRefresh',
      'refreshInterval',
      'showNotifications',
      'gradeThreshold'
    ]);
    
    sendResponse({ success: true, settings: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleUpdateSettings(request, sendResponse) {
  try {
    await chrome.storage.sync.set(request.settings);
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Periodic grade checking (if auto-refresh is enabled)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'gradeCheck') {
    checkGradesOnActiveTabs();
  }
});

async function checkGradesOnActiveTabs() {
  try {
    const tabs = await chrome.tabs.query({
      url: ['*://*.instructure.com/*', '*://*.canvas.*/*']
    });
    
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'refreshGrades' });
    }
  } catch (error) {
    console.error('Error checking grades on active tabs:', error);
  }
}

// Set up periodic checking
chrome.storage.sync.get(['autoRefresh', 'refreshInterval'], (result) => {
  if (result.autoRefresh) {
    const interval = result.refreshInterval || 5;
    chrome.alarms.create('gradeCheck', { periodInMinutes: interval });
  }
});

// Listen for storage changes to update alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.autoRefresh || changes.refreshInterval) {
      chrome.alarms.clear('gradeCheck');
      
      chrome.storage.sync.get(['autoRefresh', 'refreshInterval'], (result) => {
        if (result.autoRefresh) {
          const interval = result.refreshInterval || 5;
          chrome.alarms.create('gradeCheck', { periodInMinutes: interval });
        }
      });
    }
  }
});

// Handle tab updates to refresh grades
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url.includes('instructure.com') || tab.url.includes('canvas'))) {
    // Small delay to let Canvas load
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'refreshGrades' }).catch(() => {
        // Ignore errors if content script isn't loaded
      });
    }, 2000);
  }
});