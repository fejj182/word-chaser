import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Room Management & Multiplayer Flows', () => {
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

    // Reset RTDB emulator before each test
    try {
      await host.request.put('http://127.0.0.1:9000/.json?ns=demo-word-chaser', {
        data: null
      });
    } catch (error) {
      console.warn('Could not reset RTDB emulator:', error);
    }
  });

  test.afterEach(async () => {
    // Clean up browser contexts
    await hostCtx?.close();
    await p2Ctx?.close();
  });

  test.afterAll(async ({ browser }) => {
    // Reset RTDB emulator after all tests complete
    try {
      const cleanupCtx = await browser.newContext();
      const cleanupPage = await cleanupCtx.newPage();
      await cleanupPage.request.put('http://127.0.0.1:9000/.json?ns=demo-word-chaser', {
        data: null
      });
      await cleanupCtx.close();
      console.log('✅ RTDB emulator cleaned up after all tests (worker cleanup)');
    } catch (error) {
      console.warn('Could not reset RTDB emulator after tests:', error);
    }
  });

  test('should create room, join with second player, and start game when all ready', async () => {
    // Host creates room
    await host.goto('/');
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
    
    // Verify host badge
    await expect(host.getByTestId('host-badge')).toBeVisible();
    
    // Second player joins
    await p2.goto('/');
    await p2.getByRole('button', { name: /join existing room/i }).click();
    await p2.getByLabel(/room code/i).fill(roomCode);
    await p2.getByLabel(/alias/i).fill('Second Player');
    await p2.getByRole('button', { name: /^join room$/i }).click();
    
    // Verify both players are in the room
    await expect(host.getByTestId('players-count')).toContainText('2');
    await expect(p2.getByTestId('players-count')).toContainText('2');
    
    // Second player readies up (host is ready by default)
    const p2ReadyBtn = p2.getByRole('button', { name: /ready/i });
    await expect(p2ReadyBtn).toBeVisible();
    await p2ReadyBtn.click();
    
    // Host should see start button enabled
    const startBtn = host.getByRole('button', { name: /start game/i });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
    await startBtn.click();

    await expect(host).toHaveURL(/\/game\/.+/);
    await expect(p2).toHaveURL(/\/game\/.+/);

    const wordInput = host.getByRole('textbox', { name: /current word/i });
    expect(wordInput).toBeVisible();

    const p2WordInput = p2.getByRole('textbox', { name: /current word/i });
    expect(p2WordInput).toBeVisible();
  });

  test('should transfer host role when original host leaves room', async () => {
    // Create room and join
    await host.goto('/');
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
    
    // Verify original host badge
    await expect(host.getByTestId('host-badge')).toBeVisible();
    
    // Second player joins
    await p2.goto('/');
    await p2.getByRole('button', { name: /join existing room/i }).click();
    await p2.getByLabel(/room code/i).fill(roomCode);
    await p2.getByLabel(/alias/i).fill('Second Player');
    await p2.getByRole('button', { name: /^join room$/i }).click();
    
    // Verify both players are in room
    await expect(host.getByTestId('players-count')).toContainText('2');
    await expect(p2.getByTestId('players-count')).toContainText('2');
    
    // Host leaves
    await host.getByRole('button', { name: /leave room/i }).click();
    
    // Wait for host transfer to complete
    await expect(p2.getByTestId('players-count')).toContainText('1');
    await expect(p2.getByTestId('host-badge')).toBeVisible();
  });
});
