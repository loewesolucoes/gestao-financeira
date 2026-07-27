// jsdom (Jest's testEnvironment) does not implement BroadcastChannel, and
// Node's own `worker_threads` BroadcastChannel keeps an open handle alive
// that prevents Jest from exiting after the test run. Use a lightweight
// no-op mock instead so modules that reference BroadcastChannel at import
// time (e.g. NotificationUtil) can be loaded in tests without hanging.
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string
    onmessage: ((event: MessageEvent) => void) | null = null

    constructor(name: string) {
      this.name = name
    }

    postMessage(): void {
      // no-op in tests
    }

    close(): void {
      // no-op in tests
    }

    addEventListener(): void {
      // no-op in tests
    }

    removeEventListener(): void {
      // no-op in tests
    }
  }

  // @ts-expect-error - simplified mock, not a full BroadcastChannel implementation
  globalThis.BroadcastChannel = MockBroadcastChannel
}
