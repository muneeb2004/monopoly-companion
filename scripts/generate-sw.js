const workboxBuild = require('workbox-build');
const path = require('path');

(async () => {
  try {
    const distDir = path.resolve(__dirname, '..', 'dist');

    const { count, size } = await workboxBuild.generateSW({
      swDest: path.join(distDir, 'sw.js'),
      globDirectory: distDir,
      globPatterns: ['**/*.{html,js,css,png,svg,webmanifest}'],
      navigateFallback: '/index.html',
      runtimeCaching: [
        {
          urlPattern: /.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'runtime-cache'
          }
        }
      ]
    });

    console.log(`Generated sw, precached ${count} files, total ${size} bytes`);
  } catch (err) {
    console.error('Workbox generateSW failed', err);
    process.exit(1);
  }
})();
