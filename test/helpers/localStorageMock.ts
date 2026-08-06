// Mock in-memory di localStorage per i test: storage.ts usa solo
// getItem/setItem, quindi non serve un ambiente jsdom completo.
export function installLocalStorageMock() {
  const store = new Map<string, string>();
  const mock = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
  (globalThis as any).localStorage = mock;
  return mock;
}
