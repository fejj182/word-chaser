// Helper function to set up a game with two players and a specific test grid
import { expect, Page } from '@playwright/test';

export const TEST_GRIDS = {
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

export async function setupGameWithTestGrid(host: Page, p2: Page, testGridType: keyof typeof TEST_GRIDS) {
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