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
    await host.clock.install();
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    await expect(host.getByRole('grid')).toBeVisible();
    await expect(host.getByText('Round 1')).toBeVisible();
    await expect(host.locator('text=Round 1 Results')).not.toBeVisible();

    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');

    await host.getByRole('button', { name: /submit/i }).click();

    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('CAT')).toBeVisible();
    
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);

    const resultsModal = host.locator('text=Round 1 Results');
    await expect(resultsModal).toBeVisible();
    
    await expect(resultsModal).toContainText('Round 1 Results');
    await expect(host.locator('text=Next round starts in')).toBeVisible();
    await expect(host.locator('text=Host Player wins this round!')).toBeVisible();
  });

  test('shows round results modal after timer expires with no winner', async () => {
    await host.clock.install();
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');
    
    await expect(host.getByRole('grid')).toBeVisible();
    await expect(host.getByText('Round 1')).toBeVisible();
    await expect(host.locator('text=Round 1 Results')).not.toBeVisible();
    
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    const resultsModal = host.locator('text=Round 1 Results');
    await expect(resultsModal).toBeVisible();
    await expect(host.locator('text=Next round starts in')).toBeVisible();
    await expect(host.locator('text=No winners this round')).toBeVisible();
  });

  test('next round starts with new grid after 5 seconds', async () => {
    await host.clock.install();
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    await expect(host.getByRole('grid')).toBeVisible();
    await expect(host.getByText('Round 1')).toBeVisible();

    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    const resultsModal = host.locator('text=Round 1 Results');
    await expect(resultsModal).toBeVisible();
    
    await host.clock.fastForward(5000);

    // Wait for modal to disappear before checking for next round
    await expect(resultsModal).not.toBeVisible();
    
    await expect(host.getByRole('grid')).toBeVisible();    
    await expect(host.getByText('Round 2')).toBeVisible();
    await expect(host.getByText('1:00')).toBeVisible();
  });
});
