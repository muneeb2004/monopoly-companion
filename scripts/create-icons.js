const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const src = path.resolve(__dirname, '..', 'public', 'vite.svg');
    const outDir = path.resolve(__dirname, '..', 'public', 'icons');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const svgBuffer = fs.readFileSync(src);

    await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
    await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));

    // maskable copies
    await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(outDir, 'maskable-icon-192.png'));
    await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(outDir, 'maskable-icon-512.png'));

    console.log('Icons generated');
  } catch (err) {
    console.error('Error generating icons', err);
    process.exit(1);
  }
})();
