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
    await expect(host.getByText('Round 1 Results')).not.toBeVisible();

    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');

    await host.getByRole('button', { name: /submit/i }).click();

    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('CAT')).toBeVisible();
    
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);

    const resultsModal = host.getByText('Round 1 Results');
    await expect(resultsModal).toBeVisible();
    await expect(resultsModal).toContainText('Round 1 Results');

    await expect(host.getByText('Next round starts in')).toBeVisible();
    await expect(host.getByText('Host Player wins this round!')).toBeVisible();
  });

  test('next round starts with new grid after 5 seconds', async () => {
    await host.clock.install();
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    await expect(host.getByRole('grid')).toBeVisible();
    await expect(host.getByText('Round 1')).toBeVisible();

    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    const resultsModal = host.getByText('Round 1 Results');
    await expect(resultsModal).toBeVisible();
    
    await host.clock.fastForward(5000);

    // Wait for modal to disappear before checking for next round
    await expect(resultsModal).not.toBeVisible();
    
    await expect(host.getByRole('grid')).toBeVisible();    
    await expect(host.getByText('Round 2')).toBeVisible();
    await expect(host.getByText('1:00')).toBeVisible();
  });

  test('shows final game results modal with winner after final round', async () => {
    await host.clock.install();
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Round 1: Host submits a word, P2 doesn't
    await expect(host.getByRole('grid')).toBeVisible();
    await expect(host.getByText('Round 1')).toBeVisible();

    const hostWordInput = host.getByLabel(/current word/i);
    await hostWordInput.fill('CAT');
    await host.getByRole('button', { name: /submit/i }).click();
    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('CAT')).toBeVisible();

    // Fast forward to end of round 1
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    const round1Results = host.getByText('Round 1 Results');
    await expect(round1Results).toBeVisible();
    await expect(host.getByText('Host Player wins this round!')).toBeVisible();
    
    // Wait for round 2 to start
    await host.clock.fastForward(5000);
    await expect(round1Results).not.toBeVisible();
    await expect(host.getByText('Round 2')).toBeVisible();

    // Round 2: Host submits another word, P2 submits one
    const hostWordInput2 = host.getByLabel(/current word/i);
    await hostWordInput2.fill('DOG');
    await host.getByRole('button', { name: /submit/i }).click();
    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('DOG')).toBeVisible();

    // P2 submits a word
    const p2WordInput = p2.getByLabel(/current word/i);
    await p2WordInput.fill('BAT');
    await p2.getByRole('button', { name: /submit/i }).click();
    await expect(p2.getByRole('region', { name: 'Submitted words' }).getByText('BAT')).toBeVisible();

    // Fast forward to end of round 2
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    const round2Results = host.getByText('Round 2 Results');
    await expect(round2Results).toBeVisible();
    await expect(host.getByText('No winners this round')).toBeVisible();
    
    // Wait for round 3 to start
    await host.clock.fastForward(5000);
    await expect(round2Results).not.toBeVisible();
    await expect(host.getByText('Round 3')).toBeVisible();

    // Fast forward to end of final round
    await host.clock.fastForward(60000);
    await host.waitForTimeout(1000);
    
    // Check for final game results modal
    const finalResultsModal = host.getByRole('dialog', {name: 'Final Game Results'});
    await expect(finalResultsModal).toBeVisible();
    await expect(finalResultsModal.getByText('Game Complete!')).toBeVisible();

    await expect(finalResultsModal.getByText('Host Player Wins!')).toBeVisible();
    
    // Verify winner announcement
    await expect(finalResultsModal.getByText('Host Player Wins!')).toBeVisible();
    await expect(finalResultsModal.getByText('Final Score: 60 points')).toBeVisible(); // 30 + 30
    
    // Verify final leaderboard
    await expect(finalResultsModal.getByText('Final Leaderboard')).toBeVisible();
    await expect(finalResultsModal.getByText('🥇')).toBeVisible();
    await expect(finalResultsModal.getByText('🥈')).toBeVisible();
    
    // Verify round summary
    await expect(finalResultsModal.getByText('Round Summary')).toBeVisible();
    await expect(finalResultsModal.getByText('Round 1')).toBeVisible();
    await expect(finalResultsModal.getByText('Round 2')).toBeVisible();
    await expect(finalResultsModal.getByText('Round 3')).toBeVisible(); // Round 3 is shown twice because of the current round still being rendered
    
    // Verify action buttons
    await expect(host.getByRole('button', { name: /return to menu/i })).toBeVisible();
    
    // Test return to menu functionality
    await host.getByRole('button', { name: /return to menu/i }).click();
    await expect(host).toHaveURL('http://localhost:3000/');
  });
});
