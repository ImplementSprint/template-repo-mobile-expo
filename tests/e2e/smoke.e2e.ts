import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(20000);
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
