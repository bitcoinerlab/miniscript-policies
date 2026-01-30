import { compileMiniscript, compilePolicy, ready } from '../dist/index.js';

describe('Policy compile smoke test', () => {
  beforeAll(async () => {
    await ready;
  });

  test('compilePolicy round-trips to compileMiniscript', () => {
    const policy = 'or(and(pk(A),older(8640)),pk(B))';
    const { miniscript, asm: asmFromPolicy, issane: issaneFromPolicy } =
      compilePolicy(policy);

    const { asm: asmFromMiniscript, issane: issaneFromMiniscript } =
      compileMiniscript(miniscript);

    expect(miniscript.length).toBeGreaterThan(0);
    expect(asmFromPolicy).toEqual(asmFromMiniscript);
    expect(issaneFromPolicy).toEqual(issaneFromMiniscript);
  });
});
