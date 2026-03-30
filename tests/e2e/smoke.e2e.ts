import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();
    await waitFor(element(by.id('home-title'))).toExist().withTimeout(60000);
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
