describe('Boilerplate app smoke flow', () => {
  beforeAll(async () => {
    try {
      await device.launchApp({ newInstance: true });
    } catch {
      // Android emulators in CI can occasionally fail the first WebSocket-ready handshake.
      // Retry once with a fresh instance before failing the suite.
      await device.launchApp({ newInstance: true });
    }
  });

  it('renders the home screen title', async () => {
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(20000);
    await expect(element(by.id('home-title'))).toBeVisible();
    await expect(element(by.id('environment-badge'))).toBeVisible();
  });
});
