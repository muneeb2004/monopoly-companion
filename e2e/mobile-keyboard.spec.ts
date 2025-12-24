import { test, expect } from '@playwright/test';

test.describe('Mobile keyboard / numeric input behavior', () => {
  test('Settings modal numeric inputs accept typed numbers and have inputMode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Create a new game to enter setup state
    await page.waitForSelector('text=Create New Game', { timeout: 10000 });
    await page.click('text=Create New Game');
    // Wait for settings button to be ready and open it
    await page.waitForSelector('button[title="Game Settings"]', { timeout: 10000 });
    await page.click('button[title="Game Settings"]');
    await expect(page.locator('text=Game Settings')).toBeVisible({ timeout: 5000 });

    const starting = page.locator('label:has-text("Starting Money") + input');
    await expect(starting).toHaveAttribute('inputmode', 'numeric');
    await expect(starting).toHaveAttribute('pattern', '[0-9]*');

    await starting.fill('12345');
    expect(await starting.inputValue()).toBe('12345');

    // Multipliers should allow decimal entry
    const priceMultiplier = page.locator('label:has-text("Property Price Multiplier") + input');
    await expect(priceMultiplier).toHaveAttribute('inputmode', 'decimal');
    await priceMultiplier.fill('1.5');
    expect(await priceMultiplier.inputValue()).toBe('1.5');
  });

  test('Transfer (Pay) modal amount input uses numeric keypad and accepts numbers', async ({ page }) => {
    await page.goto('/?e2e=true&players=2&autostart=true');
    await page.waitForLoadState('networkidle');
    // Wait for ActionCenter to be present
    await page.waitForSelector('text=Pay', { timeout: 20000 });

    // Click Pay button (use page context click as fallback)
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Pay')) as HTMLElement | undefined;
      if (btn) btn.click();
    });

    // Transfer modal open - find amount input
    const amountInput = page.locator('label:has-text("Amount ($)") + input');
    await expect(amountInput).toHaveAttribute('inputmode', 'numeric');
    await amountInput.focus();
    await page.keyboard.type('150');
    expect(await amountInput.inputValue()).toBe('150');
  });

  test('Dice manual entry accepts numeric input on mobile', async ({ page }) => {
    await page.goto('/?e2e=true&players=2&autostart=true');
    await page.waitForLoadState('networkidle');
    // Dashboard should be active; wait for action center controls
    await page.waitForSelector('[title="Switch to Physical Dice"]', { timeout: 20000 });

    // Wait for physical dice switch inside ActionCenter
    const diceSwitch = page.locator('[title="Switch to Physical Dice"]');
    await expect(diceSwitch).toHaveCount(1, { timeout: 20000 });
    // Some mobile environments can block regular clicks; invoke click in page context as a fallback
    await page.evaluate(() => {
      const el = document.querySelector('[title="Switch to Physical Dice"]') as HTMLElement | null;
      if (el) el.click();
    });

    const manualInput = page.locator('input[placeholder="#"]');
    await expect(manualInput).toHaveAttribute('inputmode', 'numeric');
    await manualInput.focus();
    await page.keyboard.type('7');
    expect(await manualInput.inputValue()).toBe('7');
  });
});
