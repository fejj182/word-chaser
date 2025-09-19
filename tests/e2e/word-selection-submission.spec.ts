import { test, expect, BrowserContext, Page } from '@playwright/test';
import { setupGameWithTestGrid } from './fixtures/e2e-helpers';

test.describe('Word Selection and Submission', () => {
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

  test('should allow clicking letters on grid to form words with known grid', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Wait for grid to be fully loaded
    await expect(host.getByRole('grid')).toBeVisible();
    
    // Verify we have the expected test grid
    const gridButtons = host.locator('[role="grid"] button');
    await expect(gridButtons).toHaveCount(16); // 4x4 grid
    
    // Click first letter (should be 'C')
    await gridButtons.nth(0).click();
    
    // Verify current word shows the first letter
    await expect(host.getByText('Current word: C')).toBeVisible();
    
    // Click second letter (should be 'A' - adjacent to 'C')
    await gridButtons.nth(1).click();
    
    // Verify current word shows both letters
    await expect(host.getByText('Current word: CA')).toBeVisible();
    
    // Click third letter (should be 'T' - forming 'CAT')
    await gridButtons.nth(2).click();
    
    // Verify we can form 'CAT'
    await expect(host.getByText('Current word: CAT')).toBeVisible();
  });

  test('should allow clicking letter on grid to select tiles for word', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');
    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(1).click();
    await expect(host.getByText('Current word: A')).toBeVisible();
    await expect(gridButtons.nth(1)).toHaveClass(/bg-blue-500/);
    await expect(gridButtons.nth(9)).toHaveClass(/bg-blue-500/);
    await expect(gridButtons.nth(13)).toHaveClass(/bg-blue-500/);
    await gridButtons.nth(4).click();
    await expect(host.getByText('Current word: AD')).toBeVisible();
    await expect(gridButtons.nth(1)).toHaveClass(/bg-blue-500/);
    await expect(gridButtons.nth(4)).toHaveClass(/bg-blue-500/);
    await expect(gridButtons.nth(9)).toHaveClass(/bg-blue-500/);
    await expect(gridButtons.nth(13)).not.toHaveClass(/bg-blue-500/);
  });


  test('should allow typing words in input field with known grid', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    // Type a word that exists in our test grid
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');
    
    // Wait for debounce to complete
    await host.waitForTimeout(200);
    
    // Verify the word appears in current word display
    await expect(host.getByText('Current word: CAT')).toBeVisible();
    
    // Verify input field shows the typed word
    await expect(wordInput).toHaveValue('CAT');
  });

  test('should submit valid words successfully with known grid', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    // Type a valid word that exists in our test grid
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');
    
    // Wait for debounce to complete
    await host.waitForTimeout(200);
    
    // Verify submit button is enabled
    const submitButton = host.getByRole('button', { name: /submit word/i });
    await expect(submitButton).toBeEnabled();
    
    // Submit the word
    await submitButton.click();
    
    // Wait for submission to complete
    await host.waitForTimeout(1000);
    
    // Verify the word appears in submitted words list
    await expect(host.getByText('Submitted Words')).toBeVisible();
    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('CAT')).toBeVisible();
    
    // Check for the submitted word (should show with checkmark if valid)
    const submittedWordElement = host.locator('[class*="text-green-600"], [class*="text-red-600"]').first();
    await expect(submittedWordElement).toBeVisible();
    
    // Verify input is cleared after submission
    await expect(wordInput).toHaveValue('');

    // Verify player score has increased
    await expect(host.getByText('Score: 30')).toBeVisible();

    // Player 2 types a valid word that exists in our test grid
    const p2WordInput = p2.getByLabel(/current word/i);
    await p2WordInput.fill('DOGS');

    // Player 2 submits the word
    const p2SubmitButton = p2.getByRole('button', { name: /submit word/i });
    await expect(p2SubmitButton).toBeEnabled();
    await p2SubmitButton.click();

    // Verify the word appears in submitted words list
    await expect(p2.getByText('Submitted Words')).toBeVisible();
    await expect(p2.getByRole('region', { name: 'Submitted words' }).getByText('DOGS')).toBeVisible();

    // Verify player score has increased
    await expect(p2.getByText('Score: 40')).toBeVisible();
    
    // Verify player 1's word submission was successful
    await expect(p2.getByRole('region', { name: 'Live scoreboard' }).getByText('30')).toBeVisible();
    await expect(p2.getByText('Score: 30 points')).toBeVisible();
  });

  test('should not allow submitting the same word twice', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Player 1 submits the word
    await host.getByLabel(/current word/i).fill('DOGS');
    await host.getByRole('button', { name: /submit word/i }).click();

    // Verify the word is submitted and score is updated
    await expect(host.getByText('Submitted Words')).toBeVisible();
    await expect(host.getByRole('region', { name: 'Submitted words' }).getByText('DOGS')).toBeVisible();
    await expect(host.getByText('Score: 40')).toBeVisible();

    // Player 1 tries to submit the same word again
    await host.getByLabel(/current word/i).fill('DOGS');
    // button to be disabled
    await expect(host.getByRole('button', { name: /submit word/i })).toBeDisabled();

    // Player 2 submits the same word
    await p2.getByLabel(/current word/i).fill('DOGS');
    await expect(p2.getByRole('button', { name: /submit word/i })).toBeDisabled();
  });

  test('should handle invalid word submissions with no-words grid', async () => {
    await setupGameWithTestGrid(host, p2, 'NO_WORDS');

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    // Type a word that cannot be formed on this grid
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');
    
    // Wait for debounce to complete
    await host.waitForTimeout(200);
    
    // Verify submit button is disabled (word cannot be formed on grid)
    const submitButton = host.getByRole('button', { name: /submit word/i });
    await expect(submitButton).toBeDisabled();
    
    // Verify input shows invalid styling
    await expect(wordInput).toHaveClass(/border-red-500/);
  });

  test('should clear word selection and input', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Wait for grid to be visible
    await expect(host.getByRole('grid')).toBeVisible();
    
    // Click a few letters to form a word
    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(0).click();
    await gridButtons.nth(1).click();
    
    // Click clear button closest to input field
    const gridClearButton = host.getByRole('button', { name: 'Clear' }).first()
    await gridClearButton.click();
    
    // Verify current word display is cleared
    await expect(host.getByText(/Current word:/)).not.toBeVisible();

    // Also type in the input field
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('TEST');
    
    // Wait for debounce
    await host.waitForTimeout(200);

    // Click clear button closest to input field
    const formClearButton = host.getByRole('form').getByRole('button', { name: 'Clear' })
    await formClearButton.click();

    await expect(wordInput).toHaveValue('');
  });

  test('should show validation feedback for current word', async () => {
    await setupGameWithTestGrid(host, p2, 'COMMON_WORDS');

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    const wordInput = host.getByLabel(/current word/i);
    
    // Enter a short word (less than 3 characters) on the grid
    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(0).click();
    await gridButtons.nth(1).click();

    await host.waitForTimeout(200);
    
    // Verify submit button is disabled for short words
    const submitButton = host.getByRole('button', { name: /submit word/i });
    await expect(submitButton).toBeDisabled();
    
    // Enter a longer word on the grid
    await gridButtons.nth(2).click();
    await host.waitForTimeout(200);
    
    // Verify submit button is enabled for valid length
    await expect(submitButton).toBeEnabled();
    
    // Verify input field shows validation styling
    await expect(wordInput).toHaveClass(/border-green-500/);
  });
});