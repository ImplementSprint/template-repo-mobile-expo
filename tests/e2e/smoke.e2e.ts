import { by, element, expect } from 'detox';

describe('Boilerplate app smoke flow', () => {
  it('placeholder e2e test', async () => {
    await expect(element(by.text('Expo TS Boilerplate'))).toBeVisible();
  });
});
