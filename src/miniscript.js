// Initial author: Pieter Wuille ( https://github.com/sipa/miniscript/blob/master/index.html)
// Adapted by Jose-Luis Landabaso - https://bitcoinerlab.com:
//  compilePolicy and compilePolicyTaproot with sanity flags

import bindings from './bindings.js';
import { analyzeMiniscript } from '@bitcoinerlab/miniscript';

const cleanAsm = asm =>
  asm
    .trim()
    .replace(/\n/g, ' ')
    .replace(/ +(?= )/g, '');

let Module;
let em_miniscript_compile;
let modulePromise;

const initModule = () => {
  if (!modulePromise) {
    modulePromise = Promise.resolve(bindings()).then(resolved => {
      Module = resolved;
      em_miniscript_compile = Module.cwrap('miniscript_compile', 'none', [
        'string',
        'number',
        'number',
        'number',
        'number',
        'number',
        'number'
      ]);
      return Module;
    });
  }

  return modulePromise;
};

export const ready = initModule();

const ensureReady = () => {
  if (!Module || !em_miniscript_compile) {
    throw new Error('Miniscript bindings not ready. Await ready before calling compile functions.');
  }
};

/**
 * @typedef {Object} CompilePolicyResult
 * @property {string} miniscript - The compiled miniscript expression.
 * @property {string} asm - The compiled miniscript as Bitcoin asm code.
 * @property {boolean} issane - Whether the miniscript is sane at the top level.
 * @property {boolean} issanesublevel - Whether the miniscript is sane at the sublevel.
 */

/**
 * @typedef {Object} CompilePolicyTaprootResult
 * @property {string} miniscript - Rewritten tapscript miniscript, or an error marker string.
 * @property {boolean} issane - Whether the miniscript is sane at the top level.
 */

/**
 * Compiles a miniscript policy into a miniscript expression (if possible).
 * @function
 *
 * @param {string} policy - The miniscript policy to compile.
 * @returns {CompilePolicyResult}
 */
export const compilePolicy = policy => {
  ensureReady();
  const miniscript = Module._malloc(10000);
  const cost = Module._malloc(500);
  const asm = Module._malloc(100000);
  const issane = Module._malloc(10);
  const issanesublevel = Module._malloc(10);
  em_miniscript_compile(
    policy,
    miniscript,
    10000,
    cost,
    500,
    asm,
    100000,
    issane,
    10,
    issanesublevel,
    10
  );
  const result = {
    miniscript: Module.UTF8ToString(miniscript),
    asm: cleanAsm(Module.UTF8ToString(asm)),
    issane: Module.UTF8ToString(issane) === 'true' ? true : false,
    issanesublevel:
      Module.UTF8ToString(issanesublevel) === 'true' ? true : false
  };
  Module._free(miniscript);
  Module._free(cost);
  Module._free(asm);
  Module._free(issane);
  Module._free(issanesublevel);

  return result;
};

const isCompileFailure = miniscript =>
  typeof miniscript !== 'string' ||
  miniscript === '[compile error]' ||
  miniscript.startsWith('[exception:');

const rewriteForTapscript = miniscript => miniscript.replace(/\bmulti\(/g, 'multi_a(');
const taprootRewriteError = message => `[taproot rewrite error] ${message}`;
const taprootRewriteException = message => `[taproot rewrite exception] ${message}`;

/**
 * Compiles a miniscript policy into a tapscript miniscript expression.
 *
 * Strict mode behavior:
 * 1) compile with the C++ policy compiler
 * 2) rewrite multi() to multi_a()
 * 3) validate rewritten miniscript under tapscript rules
 *
 * @param {string} policy - The miniscript policy to compile.
 * @returns {CompilePolicyTaprootResult}
 */
export const compilePolicyTaproot = policy => {
  ensureReady();

  const base = compilePolicy(policy);

  if (isCompileFailure(base.miniscript)) {
    return {
      miniscript:
        typeof base.miniscript === 'string' ? base.miniscript : '[compile error]',
      issane: false
    };
  }

  const miniscript = rewriteForTapscript(base.miniscript);

  try {
    const analysis = analyzeMiniscript(miniscript, { tapscript: true });
    const isValidAndSane = analysis.valid && analysis.issane && analysis.issanesublevel;

    if (!isValidAndSane) {
      return {
        miniscript: taprootRewriteError(
          analysis.error ||
            'multi() to multi_a() rewrite produced miniscript that is not valid/sane in tapscript context.'
        ),
        issane: false
      };
    }

    return {
      miniscript,
      issane: analysis.issane
    };
  } catch (error) {
    return {
      miniscript: taprootRewriteException(
        error instanceof Error ? error.message : String(error)
      ),
      issane: false
    };
  }
};
