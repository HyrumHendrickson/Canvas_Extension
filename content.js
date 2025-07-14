// Canvas Grade Tracker Content Script
class CanvasGradeTracker {
  constructor() {
    this.isInitialized = false;
    this.gradeData = [];
    this.courseId = null;
    this.userId = null;
    this.init();
  }

  init() {
    // Wait for Canvas to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initExtension());
    } else {
      this.initExtension();
    }
  }

  initExtension() {
    // Check if we're on a Canvas page
    if (!this.isCanvasPage()) return;

    // Extract course and user IDs
    this.extractIds();

    // Wait for sidebar to load and add our tab
    this.waitForSidebar();
  }

  isCanvasPage() {
    return window.location.hostname.includes('instructure.com') || 
           window.location.hostname.includes('canvas') ||
           document.querySelector('#application') !== null;
  }

  extractIds() {
    // Extract course ID from URL
    const courseMatch = window.location.pathname.match(/\/courses\/(\d+)/);
    if (courseMatch) {
      this.courseId = courseMatch[1];
    }

    // Try to get user ID from various sources
    const userIdElement = document.querySelector('[data-user-id]');
    if (userIdElement) {
      this.userId = userIdElement.getAttribute('data-user-id');
    } else {
      // Try to extract from global variables
      if (window.ENV && window.ENV.current_user_id) {
        this.userId = window.ENV.current_user_id;
      }
    }
  }

  waitForSidebar() {
    const observer = new MutationObserver((mutations) => {
      const sidebar = document.querySelector('#right-side') || 
                     document.querySelector('.ic-app-main-content__secondary');
      
      if (sidebar && !this.isInitialized) {
        this.addGradesTab(sidebar);
        this.isInitialized = true;
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also try immediately in case sidebar is already loaded
    setTimeout(() => {
      const sidebar = document.querySelector('#right-side') || 
                     document.querySelector('.ic-app-main-content__secondary');
      if (sidebar && !this.isInitialized) {
        this.addGradesTab(sidebar);
        this.isInitialized = true;
      }
    }, 1000);
  }

  addGradesTab(sidebar) {
    // Create grades tab container
    const gradesContainer = document.createElement('div');
    gradesContainer.id = 'canvas-grade-tracker';
    gradesContainer.className = 'canvas-grade-tracker-container';

    // Create tab header
    const tabHeader = document.createElement('div');
    tabHeader.className = 'grade-tracker-header';
    tabHeader.innerHTML = `
      <h3 class="grade-tracker-title">
        <i class="icon-analytics"></i>
        Grade Tracker
      </h3>
      <button class="grade-tracker-toggle" title="Toggle Grade Tracker">
        <i class="icon-mini-arrow-down"></i>
      </button>
    `;

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.className = 'grade-tracker-content';
    contentArea.innerHTML = `
      <div class="grade-tracker-loading">
        <p>Loading grade data...</p>
        <div class="loading-spinner"></div>
      </div>
    `;

    gradesContainer.appendChild(tabHeader);
    gradesContainer.appendChild(contentArea);

    // Insert at the top of the sidebar
    sidebar.insertBefore(gradesContainer, sidebar.firstChild);

    // Add toggle functionality
    tabHeader.querySelector('.grade-tracker-toggle').addEventListener('click', () => {
      contentArea.classList.toggle('collapsed');
      const icon = tabHeader.querySelector('.grade-tracker-toggle i');
      icon.classList.toggle('icon-mini-arrow-down');
      icon.classList.toggle('icon-mini-arrow-right');
    });

    // Load grades data
    this.loadGrades(contentArea);
  }

  async loadGrades(contentArea) {
    try {
      if (!this.courseId) {
        contentArea.innerHTML = '<p class="error">Course ID not found. Please navigate to a course page.</p>';
        return;
      }

      // Try multiple methods to get grades
      let grades = await this.fetchGradesFromAPI();
      
      if (!grades || grades.length === 0) {
        grades = await this.scrapeGradesFromPage();
      }

      if (grades && grades.length > 0) {
        this.renderGrades(contentArea, grades);
      } else {
        contentArea.innerHTML = '<p class="no-grades">No grades found for this course.</p>';
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      contentArea.innerHTML = `<p class="error">Error loading grades: ${error.message}</p>`;
    }
  }

  async fetchGradesFromAPI() {
    try {
      // Try to use Canvas API if available
      const apiUrl = `/api/v1/courses/${this.courseId}/assignments`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const assignments = await response.json();
        return this.processAPIGrades(assignments);
      }
    } catch (error) {
      console.log('API fetch failed, trying page scraping:', error);
    }
    return null;
  }

  async scrapeGradesFromPage() {
    // Look for existing grade information on the page
    const grades = [];
    
    // Try to find grades in various locations
    const gradeElements = document.querySelectorAll('.assignment_grade, .grade, .score');
    
    gradeElements.forEach(element => {
      const gradeText = element.textContent.trim();
      const parentRow = element.closest('tr, .assignment-group-row, .assignment');
      
      if (parentRow) {
        const titleElement = parentRow.querySelector('.assignment_title a, .title a, h3 a');
        const title = titleElement ? titleElement.textContent.trim() : 'Unknown Assignment';
        
        if (gradeText && gradeText !== '-' && gradeText !== 'N/A') {
          grades.push({
            name: title,
            grade: gradeText,
            url: titleElement ? titleElement.href : null
          });
        }
      }
    });

    return grades;
  }

  processAPIGrades(assignments) {
    return assignments.map(assignment => ({
      name: assignment.name,
      points_possible: assignment.points_possible,
      due_at: assignment.due_at,
      submission_types: assignment.submission_types,
      grade: 'Loading...' // Will be updated with actual grades
    }));
  }

  renderGrades(contentArea, grades) {
    const totalPoints = grades.reduce((sum, grade) => {
      const points = this.extractPoints(grade.grade);
      return sum + (points.earned || 0);
    }, 0);

    const totalPossible = grades.reduce((sum, grade) => {
      const points = this.extractPoints(grade.grade);
      return sum + (points.possible || 0);
    }, 0);

    const percentage = totalPossible > 0 ? ((totalPoints / totalPossible) * 100).toFixed(1) : 0;

    contentArea.innerHTML = `
      <div class="grade-summary">
        <div class="overall-grade">
          <span class="grade-percentage">${percentage}%</span>
          <span class="grade-points">${totalPoints}/${totalPossible} pts</span>
        </div>
        <div class="grade-indicator ${this.getGradeColor(percentage)}"></div>
      </div>
      
      <div class="grade-stats">
        <div class="stat">
          <label>Assignments:</label>
          <span>${grades.length}</span>
        </div>
        <div class="stat">
          <label>Average:</label>
          <span>${percentage}%</span>
        </div>
      </div>
      
      <div class="assignments-list">
        <h4>Recent Assignments</h4>
        ${grades.slice(0, 10).map(grade => this.renderGradeItem(grade)).join('')}
        ${grades.length > 10 ? `<p class="show-more">Showing 10 of ${grades.length} assignments</p>` : ''}
      </div>
      
      <div class="grade-actions">
        <button class="btn btn-primary grade-tracker-btn" id="refresh-grades">
          <i class="icon-refresh"></i> Refresh
        </button>
        <button class="btn btn-secondary grade-tracker-btn" id="export-grades">
          <i class="icon-download"></i> Export
        </button>
      </div>
    `;

    // Add event listeners
    contentArea.querySelector('#refresh-grades').addEventListener('click', () => {
      this.loadGrades(contentArea);
    });

    contentArea.querySelector('#export-grades').addEventListener('click', () => {
      this.exportGrades(grades);
    });
  }

  renderGradeItem(grade) {
    const points = this.extractPoints(grade.grade);
    const percentage = points.possible > 0 ? ((points.earned / points.possible) * 100).toFixed(1) : 'N/A';
    
    return `
      <div class="grade-item">
        <div class="assignment-name" title="${grade.name}">
          ${grade.url ? `<a href="${grade.url}" target="_blank">${grade.name}</a>` : grade.name}
        </div>
        <div class="assignment-grade">
          <span class="grade-score">${grade.grade}</span>
          ${percentage !== 'N/A' ? `<span class="grade-percent">(${percentage}%)</span>` : ''}
        </div>
      </div>
    `;
  }

  extractPoints(gradeText) {
    if (!gradeText) return { earned: 0, possible: 0 };
    
    // Handle various grade formats: "85/100", "85%", "85", "A", etc.
    const pointsMatch = gradeText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (pointsMatch) {
      return { earned: parseFloat(pointsMatch[1]), possible: parseFloat(pointsMatch[2]) };
    }
    
    const percentMatch = gradeText.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]);
      return { earned: percent, possible: 100 };
    }
    
    return { earned: 0, possible: 0 };
  }

  getGradeColor(percentage) {
    if (percentage >= 90) return 'grade-a';
    if (percentage >= 80) return 'grade-b';
    if (percentage >= 70) return 'grade-c';
    if (percentage >= 60) return 'grade-d';
    return 'grade-f';
  }

  exportGrades(grades) {
    const csvContent = 'Assignment,Grade,Percentage\n' + 
      grades.map(grade => {
        const points = this.extractPoints(grade.grade);
        const percentage = points.possible > 0 ? ((points.earned / points.possible) * 100).toFixed(1) : 'N/A';
        return `"${grade.name}","${grade.grade}","${percentage}%"`;
      }).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-grades-${this.courseId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

// Initialize the extension
new CanvasGradeTracker();