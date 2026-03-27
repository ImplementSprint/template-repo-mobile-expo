declare const device: {
  launchApp(options?: { newInstance?: boolean }): Promise<void>;
};

declare const by: {
  id(id: string): unknown;
};

declare function element(matcher: unknown): unknown;

declare function waitFor(target: unknown): {
  toBeVisible(): {
    withTimeout(timeout: number): Promise<void>;
  };
};

declare namespace jest {
  interface Matchers<R> {
    toBeVisible(): R;
  }
}
