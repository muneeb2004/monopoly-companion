import { test, expect } from '@playwright/test';

test('open settings and capture console output', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.goto('http://localhost:5173/');
  // Wait a little for the app to hydrate
  await page.waitForTimeout(500);

  // Try debug FAB first
  const fab = await page.$('button[title="Open Settings (dev)"]');
  if (fab) {
    await fab.click();
  } else {
    // try header button
    const headerBtn = await page.$('button[title="Settings"]');
    if (headerBtn) await headerBtn.click();
    else throw new Error('No Settings button found (dev FAB and header button missing)');
  }

  // Wait for modal or error to appear
  await page.waitForTimeout(500);

  // Capture screenshot for debugging
  await page.screenshot({ path: 'e2e-output/settings-modal.png', fullPage: true });

  // Write logs to test output for inspection
  console.log('Captured console logs:', logs.join('\n'));

  const errorLogs = logs.filter(l => l.toLowerCase().includes('error') || l.toLowerCase().includes('uncaught'));
  expect(errorLogs.length).toBe(0);
});