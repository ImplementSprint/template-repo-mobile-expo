import { by, device, element, waitFor } from 'detox';

const BEFORE_ALL_TIMEOUT_MS = 240000;
const HOME_READY_INITIAL_TIMEOUT_MS = 45000;
const HOME_READY_RECOVERY_TIMEOUT_MS = 60000;
const HOME_READY_MIN_PROBE_TIMEOUT_MS = 10000;
const HOME_SCREEN_VISIBLE_TIMEOUT_MS = 30000;
const ANDROID_RECOVERY_DELAY_MS = 3000;

function stringifyError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

async function waitMs(ms: number): Promise<void> {
  await new Promise<void>((resolve: () => void) => {
    setTimeout(resolve, ms);
  });
}

async function waitForHomeReady(timeoutMs: number): Promise<void> {
  const probes = [
    element(by.id('home-screen-root')),
    element(by.id('home-screen')),
    element(by.id('home-title')),
  ];

  const probeTimeoutMs = Math.max(
    HOME_READY_MIN_PROBE_TIMEOUT_MS,
    Math.floor(timeoutMs / probes.length),
  );

  for (const probe of probes) {
    try {
      await waitFor(probe).toExist().withTimeout(probeTimeoutMs);
      return;
    } catch {
      // Keep trying other probes and recovery path.
    }
  }

  throw new Error(`Home screen probe timed out after ${timeoutMs}ms total budget.`);
}

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    console.log('[detox-smoke] Launching app (initial attempt)...');
    await device.launchApp({ newInstance: true });

    try {
      await waitForHomeReady(HOME_READY_INITIAL_TIMEOUT_MS);
      return;
    } catch (initialError) {
      console.log(`[detox-smoke] Initial startup probe failed: ${stringifyError(initialError)}`);
      // One hard relaunch helps recover from occasional emulator focus/ANR stalls.
      await device.terminateApp();

      if (device.getPlatform() === 'android') {
        // On GitHub-hosted Linux runners, ANR overlays can steal focus.
        // Returning to launcher before relaunch reduces stuck-startup flakes.
        await device.sendToHome();
        await waitMs(ANDROID_RECOVERY_DELAY_MS);
      }

      console.log('[detox-smoke] Launching app (recovery attempt)...');
      await device.launchApp({ newInstance: true });
      await waitForHomeReady(HOME_READY_RECOVERY_TIMEOUT_MS);
    }
  }, BEFORE_ALL_TIMEOUT_MS);

  it('shows the home screen', async () => {
    await waitFor(element(by.id('home-screen-root')))
      .toBeVisible()
      .withTimeout(HOME_SCREEN_VISIBLE_TIMEOUT_MS);
    await waitFor(element(by.id('home-title')))
      .toBeVisible()
      .withTimeout(HOME_SCREEN_VISIBLE_TIMEOUT_MS);
  });
});
