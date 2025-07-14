# Canvas Grade Tracker Extension

A powerful Chrome extension that adds detailed grade tracking and analysis to Canvas LMS. Get real-time grade information, visual indicators, and comprehensive grade breakdowns right in your Canvas interface.

## Features

- **Real-time Grade Tracking**: Automatically fetches and displays your current grades
- **Visual Grade Indicators**: Color-coded grade display with percentage and letter grade equivalents
- **Detailed Assignment Breakdown**: View individual assignment scores and percentages
- **Grade Export**: Export your grades to CSV format for external analysis
- **Historical Data**: Track grade changes over time
- **Auto-refresh**: Automatically update grades at specified intervals
- **Sidebar Integration**: Seamlessly integrates with Canvas's existing interface

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. **Download the Extension Files**
   - Clone this repository or download all the files
   - Ensure you have all these files in a folder:
     - `manifest.json`
     - `content.js`
     - `styles.css`
     - `background.js`
     - `popup.html`
     - `popup.js`

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing all the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in your Chrome toolbar
   - Find "Canvas Grade Tracker" and click the pin icon

### Method 2: Create Extension Package

1. **Zip the Files**
   - Create a ZIP file containing all the extension files
   - Make sure `manifest.json` is in the root of the ZIP

2. **Load in Developer Mode**
   - Follow steps 2-4 from Method 1, but select the ZIP file instead

## Usage

### Getting Started

1. **Navigate to Canvas**
   - Go to your Canvas LMS site (e.g., `yourschool.instructure.com`)
   - Navigate to any course page

2. **Find the Grade Tracker**
   - Look for the "Grade Tracker" panel in the right sidebar
   - It should appear automatically when you're on a course page

3. **View Your Grades**
   - The extension will automatically load your grade data
   - You'll see your overall percentage, individual assignments, and grade breakdown

### Features Walkthrough

#### Grade Summary
- **Overall Percentage**: Your current course grade as a percentage
- **Points Earned**: Total points earned vs. total points possible
- **Color Indicator**: Visual representation of your grade level (A=Green, B=Yellow, etc.)

#### Assignment List
- **Individual Scores**: Each assignment with points and percentage
- **Quick Links**: Click assignment names to navigate directly to them
- **Recent Focus**: Shows your 10 most recent assignments by default

#### Action Buttons
- **Refresh**: Manually update your grade data
- **Export**: Download your grades as a CSV file

#### Settings (via Extension Popup)
- **Auto-refresh**: Automatically update grades every few minutes
- **Notifications**: Get notified about grade changes
- **Access via**: Click the extension icon in your browser toolbar

## Configuration

### Extension Settings

Click the Canvas Grade Tracker icon in your browser toolbar to access:

- **Auto-refresh grades**: Toggle automatic grade updates
- **Show notifications**: Enable/disable grade change notifications
- **Refresh interval**: Set how often grades are updated (when auto-refresh is on)

### Customization

The extension automatically adapts to your Canvas theme and supports:
- Light and dark modes
- Mobile-responsive design
- Canvas's existing color schemes

## Troubleshooting

### Extension Not Appearing
- Make sure you're on a Canvas course page (not the dashboard)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions/`
- **Custom Canvas Domain**: If your school uses a custom Canvas domain (not .instructure.com, .canvas.edu, or .canvaslms.com), you'll need to add it to the manifest.json file

### Adding Custom Canvas Domains
If your institution uses a custom Canvas URL (like `canvas.yourschool.edu`), you'll need to:

1. Open `manifest.json`
2. Add your domain to the `host_permissions` and `content_scripts.matches` arrays:
```json
"*://canvas.yourschool.edu/*"
```
3. Also update the domain checks in `content.js`, `background.js`, and `popup.js`
4. Reload the extension

### Grades Not Loading
- Ensure you're logged into Canvas
- Try clicking the "Refresh" button
- Check your internet connection
- Some Canvas instances may have API restrictions

### Permission Issues
- The extension only works on Canvas domains
- Make sure you've granted necessary permissions during installation

### Common Solutions
1. **Refresh the page** - Often resolves loading issues
2. **Disable and re-enable** the extension
3. **Clear browser cache** for your Canvas site
4. **Check Canvas status** - Sometimes Canvas itself has issues

## Browser Compatibility

- **Chrome**: Fully supported (primary target)
- **Microsoft Edge**: Compatible (Chromium-based)
- **Firefox**: Requires minor modifications to manifest
- **Safari**: Not currently supported

## Privacy & Security

- **No Data Collection**: This extension doesn't collect or transmit your personal data
- **Local Storage Only**: All data is stored locally in your browser
- **Canvas API**: Uses official Canvas APIs when available
- **Secure**: Only accesses Canvas pages, no external connections

## Development

### File Structure
```
canvas-grade-tracker/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality script
├── styles.css            # Extension styling
├── background.js         # Background tasks
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
└── README.md            # This file
```

### Adding Icons (Optional)
Create an `icons/` folder with:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different Canvas instances
5. Submit a pull request

## License

This project is open source. Feel free to modify and distribute according to your needs.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Canvas site is supported
3. Create an issue on GitHub with details about your problem

## Disclaimer

This extension is not officially affiliated with Instructure or Canvas LMS. Use responsibly and in accordance with your institution's policies.