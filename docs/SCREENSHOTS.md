# Adding Screenshots

This guide explains how to add screenshots to the Attendance Tracker repository.

## Required Screenshots

The following screenshots are referenced in the documentation:

### README.md
- `overview.png` - Main application view showing quarterly layout

### USER_GUIDE.md
- `app-start.png` - Application when first loaded
- `header.png` - Header section with year selector and buttons
- `status-legend.png` - Color-coded status legend
- `quarterly-view.png` - Quarterly view showing all four quarters
- `marking-attendance.png` - Dialog for selecting attendance status
- `visual-indicators.png` - Visual indicators (current week, today, etc.)
- `export.png` - Export button or Excel file example
- `import.png` - Import button or file selection dialog

## How to Take Screenshots

### macOS
1. Press `Cmd + Shift + 4` to take a screenshot of a selected area
2. Press `Cmd + Shift + 5` for more screenshot options
3. Screenshots are saved to Desktop by default

### Windows
1. Press `Windows + Shift + S` to open the snipping tool
2. Select the area you want to capture
3. The screenshot is copied to clipboard - paste it into an image editor

### Linux
1. Use `gnome-screenshot` or `shutter` (depending on your distribution)
2. Or press `Print Screen` key for full screen

## Recommended Screenshot Settings

- **Format**: PNG (lossless compression) or JPG (smaller file size)
- **Resolution**: 1920x1080 or higher
- **Quality**: High quality (80%+ for JPG)
- **File Size**: Keep under 500KB per image for faster loading

## Adding Screenshots to the Repository

1. Take the screenshots using the instructions above
2. Rename them to match the required filenames
3. Place them in the `docs/screenshots/` directory
4. Update the `.gitignore` file to remove the screenshot exclusions

### Step-by-Step

```bash
# Navigate to the screenshots directory
cd docs/screenshots

# Copy your screenshots here
# Make sure they match the required filenames

# Go back to project root
cd ../..

# Add the screenshots to git
git add docs/screenshots/*.png

# Commit the changes
git commit -m "Add screenshots to documentation"
```

## Updating .gitignore

The current `.gitignore` excludes screenshot files. To include your screenshots:

1. Open `.gitignore`
2. Remove or comment out these lines:
   ```
   docs/screenshots/*.png
   docs/screenshots/*.jpg
   docs/screenshots/*.jpeg
   ```
3. Save the file

## Screenshot Guidelines

### Content
- Show the full relevant section of the interface
- Include realistic data (not empty states where possible)
- Use consistent theme (light or dark mode)
- Ensure text is readable

### Privacy
- **Do not include** any personal information
- **Do not include** company-specific data
- **Do not include** real employee names or IDs
- Use sample/fake data for demonstration

### Quality
- Ensure images are sharp and clear
- Avoid blurry or pixelated screenshots
- Use appropriate zoom level (100-125%)
- Crop unnecessary whitespace

## Testing Screenshots

Before committing, verify that:
1. All referenced screenshots exist in `docs/screenshots/`
2. Filenames match exactly (case-sensitive)
3. Images are not broken when viewing the documentation
4. File sizes are reasonable

## Automated Screenshot Tools (Optional)

For automated screenshot generation, consider:
- **Puppeteer**: Headless Chrome for automated screenshots
- **Playwright**: Cross-browser screenshot automation
- **Cypress**: End-to-end testing with screenshot capabilities

Example using Puppeteer:
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: 'docs/screenshots/overview.png' });
  await browser.close();
})();
```

## Troubleshooting

### Screenshots not loading in documentation
- Check that filenames match exactly (case-sensitive)
- Verify files are in the correct directory (`docs/screenshots/`)
- Ensure `.gitignore` is not excluding the files

### Images appear broken
- Check file format (PNG/JPG)
- Verify file is not corrupted
- Ensure file permissions are correct

### File size too large
- Compress images using tools like TinyPNG or ImageOptim
- Consider using JPG instead of PNG for screenshots
- Reduce resolution if acceptable
