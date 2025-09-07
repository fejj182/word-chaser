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
  });

  test.afterEach(async () => {
    await hostCtx?.close();
    await p2Ctx?.close();
  });

  test('should create room, join with second player, and start game when all ready', async () => {
    // Host creates room on server 1 (localhost:3000)
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
    
    // Verify host badge
    await expect(host.getByTestId('host-badge')).toBeVisible();
    
    // Second player joins from server 2 (localhost:3001) - simulating different device/server
    await p2.goto('http://localhost:3001/');
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

    await expect(host.getByRole('grid')).toBeVisible();
    await expect(p2.getByRole('grid')).toBeVisible();
  });

  test('should transfer host role when original host leaves room', async () => {
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
    
    // Verify original host badge
    await expect(host.getByTestId('host-badge')).toBeVisible();
    
    // Second player joins from server 2 (localhost:3001)
    await p2.goto('http://localhost:3001/');
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
