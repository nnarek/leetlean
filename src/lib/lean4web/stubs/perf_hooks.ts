// LEETLEAN: Stub for Node.js perf_hooks module (not available in browser)
export const performance = globalThis.performance || {
  timeOrigin: Date.now(),
  now: () => Date.now(),
};

export default { performance };
