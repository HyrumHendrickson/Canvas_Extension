// Function to wait for the sidebar menu to be available
function waitForSidebarMenu() {
  const menu = document.querySelector('ul#menu');
  if (menu) {
    console.log("Sidebar menu found! Injecting button...");
    injectButton(menu);
  } else {
    console.log("Sidebar menu not ready yet, retrying...");
    setTimeout(waitForSidebarMenu, 500); // Retry after 0.5 seconds
  }
}

// Function to inject the custom button
function injectButton(menu) {
  // Create a new menu item
  const newButton = document.createElement('li');
  newButton.className = 'ic-app-header__menu-list-item';
  newButton.innerHTML = `
    <a class="ic-app-header__menu-list-link" href="#" id="my-extension-button">
      <div class="menu-item-icon-container" role="presentation">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <span class="menu-item__text">My Menu</span>
    </a>
  `;
  
  // Append the new button to the menu
  menu.appendChild(newButton);

  // Add event listener to the button
  document.getElementById('my-extension-button').addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remove active class from all sidebar items
    document.querySelectorAll('.ic-app-header__menu-list-item').forEach(item => {
      item.classList.remove('ic-app-header__menu-list-item--active');
    });
    
    // Add active class to this item
    newButton.classList.add('ic-app-header__menu-list-item--active');
    
    // Open the HTML page in a new tab
    window.open(chrome.runtime.getURL('myPage.html'), '_blank');
  });
}

// Start the process
waitForSidebarMenu();
