import { by, device, element, waitFor } from 'detox';

const BEFORE_ALL_TIMEOUT_MS = 240000;
const HOME_ROOT_INITIAL_TIMEOUT_MS = 25000;
const HOME_TITLE_INITIAL_TIMEOUT_MS = 20000;
const HOME_ROOT_RECOVERY_TIMEOUT_MS = 35000;
const HOME_TITLE_RECOVERY_TIMEOUT_MS = 25000;
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

async function captureFailureArtifacts(stageLabel: string): Promise<void> {
  const screenshotName = `detox-smoke-${stageLabel}-${Date.now()}`;

  try {
    await device.takeScreenshot(screenshotName);
    console.log(`[detox-smoke] Captured failure screenshot: ${screenshotName}`);
  } catch (error) {
    console.log(`[detox-smoke] Failed to capture screenshot (${stageLabel}): ${stringifyError(error)}`);
  }
}

async function waitForAnyProbe(
  probeIds: string[],
  timeoutMs: number,
  phaseLabel: string,
  attemptLabel: 'initial' | 'recovery',
): Promise<void> {
  const phaseStartedAt = Date.now();

  const probeTimeoutMs = Math.max(
    HOME_READY_MIN_PROBE_TIMEOUT_MS,
    Math.floor(timeoutMs / probeIds.length),
  );

  for (const probeId of probeIds) {
    const probeStartedAt = Date.now();
    console.log(
      `[detox-smoke] [${attemptLabel}] [${phaseLabel}] waiting for "${probeId}" (timeout=${probeTimeoutMs}ms)...`,
    );

    try {
      await waitFor(element(by.id(probeId))).toExist().withTimeout(probeTimeoutMs);
      console.log(
        `[detox-smoke] [${attemptLabel}] [${phaseLabel}] found "${probeId}" in ${Date.now() - probeStartedAt}ms (phase elapsed=${Date.now() - phaseStartedAt}ms).`,
      );
      return;
    } catch (error) {
      console.log(
        `[detox-smoke] [${attemptLabel}] [${phaseLabel}] probe "${probeId}" failed after ${Date.now() - probeStartedAt}ms: ${stringifyError(error)}`,
      );
    }
  }

  throw new Error(`[${attemptLabel}] ${phaseLabel} timed out after ${timeoutMs}ms total budget.`);
}

async function waitForHomeReady(
  rootTimeoutMs: number,
  titleTimeoutMs: number,
  attemptLabel: 'initial' | 'recovery',
): Promise<void> {
  await waitForAnyProbe(['home-screen-root', 'home-screen'], rootTimeoutMs, 'root-exists', attemptLabel);
  await waitForAnyProbe(['home-title'], titleTimeoutMs, 'title-exists', attemptLabel);
}

describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    console.log('[detox-smoke] Launching app (initial attempt)...');
    const attemptStartedAt = Date.now();
    await device.launchApp({ newInstance: true });

    try {
      await waitForHomeReady(
        HOME_ROOT_INITIAL_TIMEOUT_MS,
        HOME_TITLE_INITIAL_TIMEOUT_MS,
        'initial',
      );
      console.log(`[detox-smoke] Initial startup completed in ${Date.now() - attemptStartedAt}ms.`);
      return;
    } catch (initialError) {
      console.log(`[detox-smoke] Initial startup probe failed: ${stringifyError(initialError)}`);
      await captureFailureArtifacts('initial-fail');
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

      try {
        await waitForHomeReady(
          HOME_ROOT_RECOVERY_TIMEOUT_MS,
          HOME_TITLE_RECOVERY_TIMEOUT_MS,
          'recovery',
        );
        console.log('[detox-smoke] Recovery startup completed successfully.');
      } catch (recoveryError) {
        await captureFailureArtifacts('recovery-fail');
        throw new Error(`Recovery startup failed: ${stringifyError(recoveryError)}`);
      }
    }
  }, BEFORE_ALL_TIMEOUT_MS);

  afterAll(async () => {
    try {
      await device.terminateApp();
    } catch (error) {
      console.log(`[detox-smoke] afterAll terminateApp skipped: ${stringifyError(error)}`);
    }
  });

  it('shows the home screen', async () => {
    await waitFor(element(by.id('home-screen-root')))
      .toBeVisible()
      .withTimeout(HOME_SCREEN_VISIBLE_TIMEOUT_MS);
    await waitFor(element(by.id('home-title')))
      .toBeVisible()
      .withTimeout(HOME_SCREEN_VISIBLE_TIMEOUT_MS);
  });
});
