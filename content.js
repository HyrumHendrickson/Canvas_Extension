// Function to wait for the sidebar menu to be available
function waitForSidebarMenu() {
  const menu = document.querySelector('ul#menu');
  if (menu) {
    console.log("Sidebar menu found! Injecting Python code editor button...");
    injectButton(menu);
  } else {
    console.log("Sidebar menu not ready yet, retrying...");
    setTimeout(waitForSidebarMenu, 500); // Retry after 0.5 seconds
  }
}

// Function to inject the custom button
function injectButton(menu) {
  // Check if button already exists to prevent duplicates
  if (document.getElementById('python-extension-button')) {
    console.log("Python extension button already exists");
    return;
  }
  
  // Create a new menu item
  const newButton = document.createElement('li');
  newButton.className = 'ic-app-header__menu-list-item';
  newButton.innerHTML = `
    <a class="ic-app-header__menu-list-link" href="#" id="python-extension-button">
      <div class="menu-item-icon-container" role="presentation">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          <path d="M8,12V14H16V12H8M8,16V18H13V16H8Z" fill="currentColor"/>
        </svg>
      </div>
      <span class="menu-item__text">Python Editor</span>
    </a>
  `;
  
  // Append the new button to the menu
  menu.appendChild(newButton);

  // Add event listener to the button
  document.getElementById('python-extension-button').addEventListener('click', (e) => {
    e.preventDefault();
    
    try {
      openPythonEditor(newButton);
    } catch (error) {
      console.error('Error opening Python editor:', error);
      alert('Error opening Python editor. Please refresh the page and try again.');
    }
  });
}

function openPythonEditor(buttonElement) {
  // Remove active class from all sidebar items
  document.querySelectorAll('.ic-app-header__menu-list-item').forEach(item => {
    item.classList.remove('ic-app-header__menu-list-item--active');
  });
  
  // Add active class to this item
  buttonElement.classList.add('ic-app-header__menu-list-item--active');
  
  // Get the Canvas app container - this is always present
  const appContainer = document.getElementById('application');
  
  // More precisely target only the main content area, preserving the sidebar
  const mainContentArea = document.querySelector('#main') || 
                         document.querySelector('#content-wrapper') ||
                         document.querySelector('.ic-Layout-contentMain') ||
                         document.querySelector('#content');
  
  // First, let's check if our extension page is already open
  const existingIframe = document.getElementById('python-extension-iframe');
  if (existingIframe) {
    // If it's already open, just focus on it
    existingIframe.focus();
    return;
  }
  
  // We use two different approaches (with fallback) to ensure the sidebar stays visible
  
  // APPROACH 1: Replace just the content area content
  if (mainContentArea && appContainer) {
    // Save the current content for when we need to restore it
    window.originalContentHtml = mainContentArea.innerHTML;
    
    // Save a reference to the content area for later restoration
    window.extensionContentArea = mainContentArea;
    
    // Create our extension iframe
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('index.html');
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.id = 'python-extension-iframe';
    iframe.title = 'Python Code Editor';
    
    // Clear and replace the content
    mainContentArea.innerHTML = '';
    mainContentArea.appendChild(iframe);
    
    // Add a custom flag to track what we've done
    document.body.setAttribute('data-python-extension-mode', 'content-replace');
  } 
  // APPROACH 2: Create a fixed overlay positioned to the right of the sidebar
  else {
    // Add a class to the body for our CSS to work
    document.body.classList.add('has-python-extension-overlay');
    
    // Create a full-screen overlay (except sidebar)
    const overlay = document.createElement('div');
    overlay.id = 'python-extension-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    // Determine sidebar width - Canvas has different sidebar widths
    const sidebar = document.querySelector('.ic-app-header') || document.querySelector('#left-side');
    const sidebarWidth = sidebar ? sidebar.offsetWidth : 84;
    overlay.style.left = sidebarWidth + 'px';
    overlay.style.backgroundColor = '#fff';
    overlay.style.zIndex = '9998';
    overlay.style.overflow = 'auto';
    
    // Create iframe for our custom page
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('index.html');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.id = 'python-extension-iframe';
    iframe.title = 'Python Code Editor';
    
    // Add to the page
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    
    // Tell the iframe to show its close button
    iframe.onload = function() {
      try {
        iframe.contentWindow.postMessage('show-close-button', '*');
      } catch (error) {
        console.warn('Could not send message to iframe:', error);
      }
    };
    
    // Add a custom flag to track what we've done
    document.body.setAttribute('data-python-extension-mode', 'overlay');
  }
  
  // Listen for messages from the iframe (only add listener once)
  if (!window.pythonExtensionMessageListener) {
    window.pythonExtensionMessageListener = function(event) {
      if (event.data === 'close-extension-page') {
        closePythonEditor(buttonElement);
      }
    };
    window.addEventListener('message', window.pythonExtensionMessageListener);
  }
  
  // Handle browser back button
  const popstateHandler = function() {
    closePythonEditor(buttonElement);
  };
  window.addEventListener('popstate', popstateHandler, { once: true });
  
  // Store the handler so we can remove it if needed
  window.currentPopstateHandler = popstateHandler;
}

// Function to close our extension page
function closePythonEditor(buttonElement) {
  const extensionMode = document.body.getAttribute('data-python-extension-mode');
  
  try {
    if (extensionMode === 'content-replace') {
      // Restore the original content
      if (window.extensionContentArea && window.originalContentHtml) {
        window.extensionContentArea.innerHTML = window.originalContentHtml;
      }
    } else if (extensionMode === 'overlay') {
      // Remove the overlay
      const overlay = document.getElementById('python-extension-overlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
      document.body.classList.remove('has-python-extension-overlay');
    }
    
    // Remove the active class from our button
    if (buttonElement) {
      buttonElement.classList.remove('ic-app-header__menu-list-item--active');
    }
    
    // Clear the mode flag
    document.body.removeAttribute('data-python-extension-mode');
    
    // Remove the popstate handler if it exists
    if (window.currentPopstateHandler) {
      window.removeEventListener('popstate', window.currentPopstateHandler);
      window.currentPopstateHandler = null;
    }
    
    console.log("Python editor closed successfully");
    
  } catch (error) {
    console.error('Error closing Python editor:', error);
  }
}

// Start the process when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForSidebarMenu);
} else {
  waitForSidebarMenu();
}
