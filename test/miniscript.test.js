import * as api from '../dist/index.js';

describe('Public API surface', () => {
  test('does not expose compileMiniscript', () => {
    expect(api.compileMiniscript).toBeUndefined();
  });

  test('exposes policy compilers and ready promise', () => {
    expect(typeof api.compilePolicy).toBe('function');
    expect(typeof api.compilePolicyTaproot).toBe('function');
    expect(api.ready).toBeInstanceOf(Promise);
  });
});
