import { by, device, element, expect } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('placeholder e2e test', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
