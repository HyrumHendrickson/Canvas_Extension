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

  // Create a simple popup menu
  const popupMenu = document.createElement('div');
  popupMenu.id = 'my-extension-menu';
  popupMenu.innerHTML = `
    <div class="menu-content">
      <h3>Hello from Extension!</h3>
      <p>This is a default menu.</p>
    </div>
  `;
  document.body.appendChild(popupMenu);

  document.getElementById('my-extension-button').addEventListener('click', (e) => {
  e.preventDefault();

  // Remove active class from all sidebar items
  document.querySelectorAll('.ic-app-header__menu-list-item').forEach(item => {
    item.classList.remove('ic-app-header__menu-list-item--active');
  });

  // Add active class to this item
  newButton.classList.add('ic-app-header__menu-list-item--active');

  // Toggle the popup menu
  popupMenu.classList.toggle('show');
});

}

// Start the process
waitForSidebarMenu();
