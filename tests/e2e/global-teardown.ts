import { request } from '@playwright/test';

async function globalTeardown() {
  console.log(' teardown: Cleaning up RTDB emulator...');
  try {
    const context = await request.newContext();
    await context.put('http://127.0.0.1:9000/.json?ns=demo-word-chaser', {
      data: null
    });
    await context.dispose();
    console.log('✅ Global teardown complete.');
  } catch (error) {
    console.warn('Could not reset RTDB emulator during global teardown:', error);
  }
}

export default globalTeardown;