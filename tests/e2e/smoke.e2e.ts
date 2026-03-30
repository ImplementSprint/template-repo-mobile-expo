import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();

    if (device.getPlatform() === 'android') {
      // On GitHub-hosted Linux runners, the Android emulator runs without KVM
      // hardware acceleration. This causes ANR dialogs during startup that steal
      // window focus even after the ANR resolves. Sending the app to the home
      // screen and relaunching (without a new instance) clears the stale dialog
      // and restores window focus so Espresso matchers can work correctly.
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
    }

    await waitFor(element(by.id('home-title'))).toExist().withTimeout(60000);
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
