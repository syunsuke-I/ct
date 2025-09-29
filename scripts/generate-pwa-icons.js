const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Create base SVG
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3b82f6" rx="64"/>
  <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="320" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">♪</text>
</svg>`;

const sizes = [192, 256, 384, 512];

async function generateIcons() {
  const svgBuffer = Buffer.from(svgIcon);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Also create a favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Generated favicon.png');
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(console.error);