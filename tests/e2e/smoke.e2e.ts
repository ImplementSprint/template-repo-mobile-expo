import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });

    if (device.getPlatform() === 'ios') {
      await device.disableSynchronization();
    }

    const homeScreen = device.getPlatform() === 'ios'
      ? element(by.label('home-screen'))
      : element(by.id('home-screen'));

    await waitFor(homeScreen).toExist().withTimeout(20000);
  });

  it('shows the home screen', async () => {
    const homeScreen = device.getPlatform() === 'ios'
      ? element(by.label('home-screen'))
      : element(by.id('home-screen'));

    await expect(homeScreen).toBeVisible();
  });
});
