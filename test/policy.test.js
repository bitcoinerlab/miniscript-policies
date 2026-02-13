import {
  compilePolicy,
  compilePolicyTaproot,
  ready
} from '../dist/index.js';

describe('Policy compile smoke test', () => {
  beforeAll(async () => {
    await ready;
  });

  test('compilePolicy returns miniscript and asm', () => {
    const policy = 'or(and(pk(A),older(8640)),pk(B))';
    const { miniscript, asm, issane, issanesublevel } = compilePolicy(policy);

    expect(miniscript.length).toBeGreaterThan(0);
    expect(asm.length).toBeGreaterThan(0);
    expect(issane).toBe(true);
    expect(issanesublevel).toBe(true);
  });
});

describe('Taproot policy compile shim', () => {
  beforeAll(async () => {
    await ready;
  });

  test('rewrites multi() to multi_a() and validates tapscript', () => {
    const result = compilePolicyTaproot('thresh(2,pk(A),pk(B),pk(C))');

    expect(result.miniscript).toContain('multi_a(');
    expect(result.issane).toBe(true);
    expect(result.issanesublevel).toBeUndefined();
    expect(result.asm).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  test('keeps miniscript unchanged when no multi() is present', () => {
    const result = compilePolicyTaproot('or(and(pk(A),older(8640)),pk(B))');

    expect(result.miniscript).not.toBe('[compile error]');
    expect(result.miniscript.includes('multi(')).toBe(false);
    expect(result.issane).toBe(true);
    expect(result.issanesublevel).toBeUndefined();
    expect(result.asm).toBeUndefined();
  });

  test('forwards reference compile errors unchanged', () => {
    const base = compilePolicy('thresh(0,pk(A))');
    const result = compilePolicyTaproot('thresh(0,pk(A))');

    expect(result.miniscript).toBe(base.miniscript);
    expect(result.issane).toBe(false);
    expect(result.issanesublevel).toBeUndefined();
    expect(result.asm).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  test.each([
    [
      'and(thresh(2,pk(A),pk(B),pk(C)),older(100))',
      /older\(100\)/
    ],
    [
      'or(thresh(2,pk(A),pk(B),pk(C)),and(pk(D),older(100)))',
      /older\(100\)/
    ],
    [
      'and(or(thresh(2,pk(A),pk(B),pk(C)),pk(D)),after(500000))',
      /after\(500000\)/
    ],
    [
      'or(and(thresh(2,pk(A),pk(B),pk(C)),after(100)),and(pk(D),after(200)))',
      /after\(100\)|after\(200\)/
    ]
  ])(
    'compiles wrapped thresh policy with timelocks: %s',
    (policy, timelockPattern) => {
      const result = compilePolicyTaproot(policy);

      expect(result.miniscript).not.toBe('[compile error]');
      expect(result.miniscript).toContain('multi_a(');
      expect(result.miniscript).not.toContain('multi(');
      expect(result.miniscript).toMatch(timelockPattern);
      expect(result.issane).toBe(true);
      expect(result.issanesublevel).toBeUndefined();
    }
  );

  test.each([
    [
      'and(thresh(2,pk(A),pk(B),pk(C)),sha256(H))',
      /sha256\(H\)/,
      []
    ],
    [
      'or(thresh(2,pk(A),pk(B),pk(C)),and(pk(D),sha256(H)))',
      /sha256\(H\)/,
      ['D']
    ],
    [
      'and(or(thresh(2,pk(A),pk(B),pk(C)),pk(D)),hash160(H))',
      /hash160\(H\)/,
      ['D']
    ],
    [
      'or(and(thresh(2,pk(A),pk(B),pk(C)),hash160(H)),and(pk(D),pk(E)))',
      /hash160\(H\)/,
      ['D', 'E']
    ],
    [
      'or(and(thresh(2,pk(A),pk(B),pk(C)),pk(D)),and(pk(E),pk(F)))',
      null,
      ['D', 'E', 'F']
    ]
  ])(
    'compiles wrapped thresh policy with preimages/keys: %s',
    (policy, preimagePattern, keys) => {
      const result = compilePolicyTaproot(policy);

      expect(result.miniscript).not.toBe('[compile error]');
      expect(result.miniscript).toContain('multi_a(');
      expect(result.miniscript).not.toContain('multi(');
      if (preimagePattern) {
        expect(result.miniscript).toMatch(preimagePattern);
      }
      for (const key of keys) {
        const keyRegex = new RegExp(`pk(?:_k)?\\(${key}\\)`);
        expect(result.miniscript).toMatch(keyRegex);
      }
      expect(result.issane).toBe(true);
      expect(result.issanesublevel).toBeUndefined();
    }
  );

  test('compiles complex wrapped thresh policy with keys, preimages, and timelocks', () => {
    const policy =
      'or(and(thresh(2,pk(A),pk(B),pk(C)),and(sha256(H),older(144))),and(pk(D),after(500000)))';
    const result = compilePolicyTaproot(policy);

    expect(result.miniscript).not.toBe('[compile error]');
    expect(result.miniscript).toContain('multi_a(');
    expect(result.miniscript).toContain('sha256(H)');
    expect(result.miniscript).toContain('older(144)');
    expect(result.miniscript).toContain('after(500000)');
    expect(result.miniscript).toMatch(/pk(?:_k)?\(D\)/);
    expect(result.issane).toBe(true);
    expect(result.issanesublevel).toBeUndefined();
  });

  test('issane is the strict success signal in this shim', () => {
    const ok = compilePolicyTaproot('thresh(2,pk(A),pk(B),pk(C))');
    const bad = compilePolicyTaproot('thresh(0,pk(A))');

    expect(ok.issane).toBe(true);
    expect(ok.issanesublevel).toBeUndefined();
    expect(bad.issane).toBe(false);
    expect(bad.issanesublevel).toBeUndefined();
  });
});
