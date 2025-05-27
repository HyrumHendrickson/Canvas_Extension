/* Styles for custom Python editor button states */
#python-extension-button:focus {
  outline: none;
}

#python-extension-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Make sure the iframe takes up all available space */
#python-extension-iframe {
  width: 100%;
  min-height: 700px;
  border: none;
  background: white;
}

/* Overlay styling for fallback mode */
#python-extension-overlay {
  box-shadow: -3px 0 10px rgba(0,0,0,0.1);
}

/* Ensure Canvas content isn't showing behind our iframe in fallback mode */
body.has-python-extension-overlay #application,
body.has-python-extension-overlay #content,
body.has-python-extension-overlay .ic-app-main-content {
  visibility: hidden;
}

/* Only the left sidebar should remain visible */
body.has-python-extension-overlay .ic-app-header {
  visibility: visible !important;
  z-index: 9999;
}

/* Ensure the Python editor button looks consistent with other Canvas buttons */
#python-extension-button .menu-item-icon-container svg {
  transition: transform 0.2s ease;
}

#python-extension-button:hover .menu-item-icon-container svg {
  transform: scale(1.1);
}

/* Active state styling */
.ic-app-header__menu-list-item--active #python-extension-button {
  background-color: rgba(255, 255, 255, 0.15);
}

/* Responsive adjustments for smaller screens */
@media (max-width: 768px) {
  #python-extension-overlay {
    left: 0 !important;
  }
  
  body.has-python-extension-overlay .ic-app-header {
    visibility: hidden !important;
  }
}
