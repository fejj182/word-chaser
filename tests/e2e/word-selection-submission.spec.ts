import { test, expect, BrowserContext, Page } from '@playwright/test';

// Test grids for predictable testing
const TEST_GRIDS = {
  COMMON_WORDS: [
    ['C', 'A', 'T', 'S'],
    ['D', 'O', 'G', 'E'],
    ['B', 'A', 'T', 'R'],
    ['M', 'A', 'N', 'Y']
  ],
  NO_WORDS: [
    ['X', 'Q', 'Z', 'J'],
    ['K', 'V', 'B', 'N'],
    ['M', 'W', 'F', 'G'],
    ['H', 'P', 'L', 'C']
  ]
};

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

  // Helper function to set up a game with two players and a specific test grid
  async function setupGameWithTestGrid(testGridType: keyof typeof TEST_GRIDS) {
    const testGrid = TEST_GRIDS[testGridType];
    const testGridParam = encodeURIComponent(JSON.stringify(testGrid));
    
    // Host creates room with test grid
    await host.goto(`http://localhost:3000/?testGrid=${testGridParam}`);
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
    await p2.goto(`http://localhost:3001/?testGrid=${testGridParam}`);
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

    return { roomCode, testGrid };
  }

  test('should allow clicking letters on grid to form words with known grid', async () => {
    await setupGameWithTestGrid('COMMON_WORDS');

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
    await setupGameWithTestGrid('COMMON_WORDS');
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
    await setupGameWithTestGrid('COMMON_WORDS');

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
    await setupGameWithTestGrid('COMMON_WORDS');

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
    
    // Check for the submitted word (should show with checkmark if valid)
    const submittedWordElement = host.locator('[class*="text-green-600"], [class*="text-red-600"]').first();
    await expect(submittedWordElement).toBeVisible();
    
    // Verify input is cleared after submission
    await expect(wordInput).toHaveValue('');

    // Verify player score has increased
    await expect(host.getByText('Score: 30')).toBeVisible();
  });

  test('should handle invalid word submissions with no-words grid', async () => {
    await setupGameWithTestGrid('NO_WORDS');

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
    await setupGameWithTestGrid('COMMON_WORDS');

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
    await setupGameWithTestGrid('COMMON_WORDS');

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