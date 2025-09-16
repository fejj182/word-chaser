import { test as base, Page, expect } from '@playwright/test';

type ConsoleCheckContext = {
  collectedErrors: string[];
  expectedErrors: string[];
};

type TestFixtures = {
  consoleErrors: (expectedErrors?: string[]) => Promise<void>;
  newCheckedPage: () => Promise<Page>;
  _consoleCheck: ConsoleCheckContext;
};

export const test = base.extend<TestFixtures>({
  _consoleCheck: [async ({}, use) => {
    const context: ConsoleCheckContext = { 
      collectedErrors: [], 
      expectedErrors: [] 
    };
    
    await use(context);
    
    const unexpectedErrors = context.collectedErrors.filter(error => 
      !context.expectedErrors.some(expected => error.includes(expected))
    );
    expect(unexpectedErrors).toEqual([]);

  }, { auto: true }],

  consoleErrors: async ({ _consoleCheck: consoleCheck }, use) => {
    const setup = async (errorsToExpect: string[] = []) => {
      consoleCheck.expectedErrors = errorsToExpect;
    };
    await use(setup);
  },

  newCheckedPage: async ({ browser, _consoleCheck }, use) => {
    const pages: Page[] = [];
    
    const newPage = async (): Promise<Page> => {
      const page = await browser.newPage();
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          _consoleCheck.collectedErrors.push(`[${page.url()}] ${msg.text()}`);
        }
      });
      pages.push(page); 
      return page;
    };

    await use(newPage);

    for (const page of pages) {
      await page.context().close();
    }
  },
});