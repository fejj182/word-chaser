import { test, expect, BrowserContext, Page } from '@playwright/test';
import { setupGameWithTestGrid } from './fixtures/e2e-helpers';

test.describe('Game Round Logic', () => {
  let hostCtx: BrowserContext;
  let host: Page;
  let p2Ctx: BrowserContext;
  let p2: Page;

  test.beforeEach(async ({ browser }) => {
    // Create isolated browser contexts for each player
    hostCtx = await browser.newContext();
    host = await hostCtx.newPage();
    p2Ctx = await browser.newContext();
    p2 = await p2Ctx.newPage();
  });

  test.afterEach(async () => {
    await hostCtx?.close();
    await p2Ctx?.close();
  });

  test('shows round results modal after timer expires', async () => {
    // Install the mock clock
    await host.clock.install();
    
    // Set up the game
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');
    
    // Wait for grid to be fully loaded
    await expect(host.getByRole('grid')).toBeVisible();
    
    // Wait for game to load
    await expect(host.getByText('Round 1')).toBeVisible();
    
    // Assert that the round results modal is not visible initially
    await expect(host.locator('text=Round 1 Results')).not.toBeVisible();
    
    // Submit some words to ensure there are results to show

    // Type a word that exists in our test grid
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');
    
    await host.getByRole('button', { name: /submit/i }).click();

    // Verify the word appears in current word display
    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('CAT')).toBeVisible();
    
    // Fast-forward the clock by 60 seconds (default round duration)
    await host.clock.fastForward(60000);
    
    // Wait a bit for the round to end and results to be calculated
    await host.waitForTimeout(1000);
    
    // Now, assert the round results modal is visible
    const resultsModal = host.locator('text=Round 1 Results');
    await expect(resultsModal).toBeVisible();
    
    // Check that it contains the expected content
    await expect(resultsModal).toContainText('Round 1 Results');
    await expect(host.locator('text=Continue to Round 2')).toBeVisible();
    await expect(host.locator('text=Host Player wins this round!')).toBeVisible();
    await expect(host.locator('text=30 points')).toBeVisible();
  });
});
