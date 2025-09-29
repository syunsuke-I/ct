const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3b82f6"/>
  <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="240" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">♪</text>
</svg>`;

// Save the SVG icon
const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('Icon template created at public/icon.svg');
console.log('Please convert this SVG to PNG files with sizes: 192x192, 256x256, 384x384, 512x512');
console.log('You can use online tools like https://cloudconvert.com/svg-to-png or install Sharp library for automatic conversion');