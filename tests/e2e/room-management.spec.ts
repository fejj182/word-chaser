import { expect, Page } from '@playwright/test';
import { test } from './fixtures/test-with-console-check';

test.describe('Room Management & Multiplayer Flows', () => {
  let host: Page;
  let p2: Page;

  test.beforeEach(async ({ newCheckedPage }) => {
    host = await newCheckedPage();
    p2 = await newCheckedPage();
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
    
    // Verify host was redirected to home page
    await expect(host).toHaveURL('http://localhost:3000/');
  });

  test('should allow non-host player to leave room successfully', async () => {
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
    
    // Second player joins from server 2 (localhost:3001)
    await p2.goto('http://localhost:3001/');
    await p2.getByRole('button', { name: /join existing room/i }).click();
    await p2.getByLabel(/room code/i).fill(roomCode);
    await p2.getByLabel(/alias/i).fill('Second Player');
    await p2.getByRole('button', { name: /^join room$/i }).click();
    
    // Verify both players are in room
    await expect(host.getByTestId('players-count')).toContainText('2');
    await expect(p2.getByTestId('players-count')).toContainText('2');
    
    // Non-host player leaves
    await p2.getByRole('button', { name: /leave room/i }).click();
    
    // Wait for player count to update
    await expect(host.getByTestId('players-count')).toContainText('1');
    
    // Verify non-host was redirected to home page
    await expect(p2).toHaveURL('http://localhost:3001/');
    
    // Verify host still has host badge and room is still active
    await expect(host.getByTestId('host-badge')).toBeVisible();
    await expect(host.getByTestId('room-code')).toBeVisible();
  });

  test('should delete room and slug when only player leaves', async ({ consoleErrors }) => {
    await consoleErrors(["Failed to join room: Error: Room not found"]);
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
    
    // Last player (host) leaves
    await host.getByRole('button', { name: /leave room/i }).click();
    
    // Host should be redirected to home page
    await expect(host).toHaveURL('http://localhost:3000/');
    
    // Try to join the room again - should fail since room was deleted
    await p2.goto('http://localhost:3001/');
    await p2.getByRole('button', { name: /join existing room/i }).click();
    await p2.getByLabel(/room code/i).fill(roomCode);
    await p2.getByLabel(/alias/i).fill('Test Player');
    await p2.getByRole('button', { name: /^join room$/i }).click();
    
    // Should show error message
    await expect(p2.getByText(/room not found/i)).toBeVisible();
  });

  test('should handle all players leaving in sequence', async () => {
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
    
    // Verify both players are in room
    await expect(host.getByTestId('players-count')).toContainText('2');
    await expect(p2.getByTestId('players-count')).toContainText('2');
    
    // First host leaves
    await host.getByRole('button', { name: /leave room/i }).click();

    // Host should still have host badge and room should be active
    await expect(p2.getByTestId('host-badge')).toBeVisible();
    await expect(p2.getByTestId('room-code')).toBeVisible();
    
    // Wait for player count to update
    await expect(p2.getByTestId('players-count')).toContainText('1');
    await expect(host).toHaveURL('http://localhost:3000/');

    // Last player leaves
    await p2.getByRole('button', { name: /leave room/i }).click();
    
    // Host should be redirected to home page
    await expect(p2).toHaveURL('http://localhost:3001/');
  });
});
