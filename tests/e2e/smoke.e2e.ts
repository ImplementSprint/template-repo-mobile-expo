import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    if (device.getPlatform() === 'android') {
      // On GitHub-hosted Linux runners, the Android emulator runs without KVM
      // hardware acceleration. This causes ANR dialogs during startup that steal
      // window focus even after the ANR resolves. We disable synchronization to
      // avoid Espresso blocking on the frozen main thread, then send to home and
      // relaunch (without a new instance) to clear the stale dialog and restore
      // window focus so Espresso matchers can work correctly.
      await device.launchApp({ newInstance: true });
      await device.disableSynchronization();
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
    } else {
      // iOS: keep Detox synchronization enabled so it naturally waits for the
      // React Native bridge and render cycle to settle before we look for elements.
      await device.launchApp({ newInstance: true });
    }

    await waitFor(element(by.id('home-title'))).toExist().withTimeout(60000);
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
