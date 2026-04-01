import { by, device, element, expect, waitFor } from 'detox';

async function waitForHomeReady(timeoutMs: number): Promise<void> {
  const probes = [element(by.id('home-screen')), element(by.id('home-title'))];

  for (const probe of probes) {
    try {
      await waitFor(probe).toExist().withTimeout(timeoutMs);
      return;
    } catch {
      // Keep trying other probes and recovery path.
    }
  }

  throw new Error('Home screen probe timed out.');
}

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
      await device.launchApp({ newInstance: true });
      await new Promise<void>((resolve) => { setTimeout(resolve, 3000); });
    }

    try {
      await waitForHomeReady(90000);
    } catch {
      // One hard relaunch helps recover from occasional emulator focus/ANR stalls.
      await device.terminateApp();
      await device.launchApp({ newInstance: true });
      await waitForHomeReady(90000);
    }
  });

  it('shows the home screen', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('home-title'))).toBeVisible();
  });
});
