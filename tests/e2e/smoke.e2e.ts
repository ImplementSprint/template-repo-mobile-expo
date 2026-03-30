import { by, device, element, expect, waitFor } from 'detox';

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await device.disableSynchronization();

    if (device.getPlatform() === 'android') {
      // On GitHub-hosted Linux runners, the Android emulator runs without KVM
      // hardware acceleration. This causes ANR dialogs during startup that steal
      // window focus. We send to home to dismiss them, relaunch to restore focus,
      // then wait 3 s for the Android OS to complete the activity focus transfer
      // before Espresso attempts any view hierarchy queries.
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
      await new Promise<void>((resolve) => { setTimeout(resolve, 3000); });
    }

    await waitFor(element(by.id('home-title'))).toExist().withTimeout(60000);
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
