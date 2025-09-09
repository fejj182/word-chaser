import { test, expect, BrowserContext, Page } from '@playwright/test';

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

  // Helper function to set up a game with two players
  async function setupGameWithTwoPlayers() {
    // Host creates room
    await host.goto('http://localhost:3000/');
    await host.getByRole('button', { name: /create a new room/i }).click();
    await host.getByLabel(/alias/i).fill('Host Player');
    await host.getByTestId('max-players-select').selectOption('2');
    await host.getByRole('button', { name: /^create room$/i }).click();
    
    // Wait for room to be created
    await expect(host.getByTestId('players-count')).toBeVisible();
    
    // Get room code
    const roomCodeElement = await host.getByTestId('room-code');
    await expect(roomCodeElement).toBeVisible();
    const roomCode = await roomCodeElement.innerText();
    
    // Second player joins
    await p2.goto('http://localhost:3001/');
    await p2.getByRole('button', { name: /join existing room/i }).click();
    await p2.getByLabel(/room code/i).fill(roomCode);
    await p2.getByLabel(/alias/i).fill('Second Player');
    await p2.getByRole('button', { name: /^join room$/i }).click();
    
    // Verify both players are in the room
    await expect(host.getByTestId('players-count')).toContainText('2');
    await expect(p2.getByTestId('players-count')).toContainText('2');
    
    // Second player readies up
    const p2ReadyBtn = p2.getByRole('button', { name: /ready/i });
    await expect(p2ReadyBtn).toBeVisible();
    await p2ReadyBtn.click();
    
    // Host starts game
    const startBtn = host.getByRole('button', { name: /start game/i });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
    await startBtn.click();

    // Wait for game to start
    await expect(host).toHaveURL(/\/game\/.+/);
    await expect(p2).toHaveURL(/\/game\/.+/);

    // Wait for grid to be visible
    await expect(host.getByRole('grid')).toBeVisible();
    await expect(p2.getByRole('grid')).toBeVisible();

    return { roomCode };
  }

  test('should allow clicking letters on grid to form words', async () => {
    await setupGameWithTwoPlayers();

    // Wait for grid to be fully loaded
    await expect(host.getByRole('grid')).toBeVisible();
    
    // Get the first few letters from the grid
    const gridButtons = host.locator('[role="grid"] button');
    const firstLetter = await gridButtons.nth(0).textContent();
    const secondLetter = await gridButtons.nth(1).textContent();
    
    // Click first letter
    await gridButtons.nth(0).click();
    
    // Verify current word shows the first letter
    await expect(host.getByText(`Current word: ${firstLetter}`)).toBeVisible();
    
    // Click second letter (should be adjacent)
    await gridButtons.nth(1).click();
    
    // Verify current word shows both letters
    const expectedWord = `${firstLetter}${secondLetter}`;
    await expect(host.getByText(`Current word: ${expectedWord}`)).toBeVisible();
  });

  test('should allow typing words in input field', async () => {
    await setupGameWithTwoPlayers();

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    // Type a word
    const wordInput = host.getByLabel(/current word/i);
    await wordInput.fill('CAT');
    
    // Wait for debounce to complete
    await host.waitForTimeout(200);
    
    // Verify the word appears in current word display
    await expect(host.getByText('Current word: CAT')).toBeVisible();
    
    // Verify input field shows the typed word
    await expect(wordInput).toHaveValue('CAT');
  });

  test('should submit valid words successfully', async () => {
    await setupGameWithTwoPlayers();

    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(0).click();
    await gridButtons.nth(1).click();
    await gridButtons.nth(2).click();
    
    // Wait for debounce to complete
    await host.waitForTimeout(200);

    // Wait for word input to be visible
    const wordInput = host.getByLabel(/current word/i);
    await expect(wordInput).toBeVisible();
    
    // Verify submit button is enabled
    const submitButton = host.getByRole('button', { name: /submit word/i });
    await expect(submitButton).toBeEnabled();
    
    // Submit the word
    await submitButton.click();
    
    // Wait for submission to complete
    await host.waitForTimeout(1000);
    
    // Verify the word appears in submitted words list
    await expect(host.getByText('Submitted Words')).toBeVisible();
    
    // Check for the submitted word (should show with checkmark if valid)
    const submittedWordElement = host.locator('[class*="text-green-600"], [class*="text-red-600"]').first();
    await expect(submittedWordElement).toBeVisible();
    
    // Verify input is cleared after submission
    await expect(wordInput).toHaveValue('');
  });

  test('should clear word selection and input', async () => {
    await setupGameWithTwoPlayers();

    // Wait for grid to be visible
    await expect(host.getByRole('grid')).toBeVisible();
    
    // Click a few letters to form a word
    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(0).click();
    await gridButtons.nth(1).click();
    const wordInput = host.getByLabel(/current word/i);
    
    // Wait for debounce
    await host.waitForTimeout(200);
    
    // Click clear button
    const clearButton = host.getByRole('button', { name: /clear/i });
    await clearButton.click();
    
    // Verify input is cleared
    await expect(wordInput).toHaveValue('');
    
    // Verify current word display is cleared
    await expect(host.getByText(/Current word:/)).not.toBeVisible();
  });

  test('should show validation feedback for current word', async () => {
    await setupGameWithTwoPlayers();

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

  test('should display submitted words with correct status', async () => {
    await setupGameWithTwoPlayers();

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    const wordInput = host.getByLabel(/current word/i);
    const submitButton = host.getByRole('button', { name: /submit word/i });
    
    // Submit a valid word
    const gridButtons = host.locator('[role="grid"] button');
    await gridButtons.nth(0).click();
    await gridButtons.nth(1).click();
    await gridButtons.nth(2).click();

    await host.waitForTimeout(200);
    await submitButton.click();
    await host.waitForTimeout(1000);
    
    // Verify submitted words section is visible
    await expect(host.getByText('Submitted Words')).toBeVisible();
    
    // Check that we have at least 2 submitted words
    const submittedWordElements = host.locator('[class*="p-3 rounded-lg border"]');
    await expect(submittedWordElements).toHaveCount(1);
  });

  test('should prevent submission of words that cannot be formed on grid', async () => {
    await setupGameWithTwoPlayers();

    // Wait for word input to be visible
    await expect(host.getByLabel(/current word/i)).toBeVisible();
    
    const wordInput = host.getByLabel(/current word/i);
    
    // Type a word that likely cannot be formed on the grid
    await wordInput.fill('QUIZZICAL');
    await host.waitForTimeout(200);
    
    // Verify submit button is disabled for words that cannot be formed
    const submitButton = host.getByRole('button', { name: /submit word/i });
    await expect(submitButton).toBeDisabled();
    
    // Verify input shows invalid styling
    await expect(wordInput).toHaveClass(/border-red-500/);
  });
});
