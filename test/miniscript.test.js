import { compileMiniscript, ready } from '../dist/index.js';
import { primitives, timeLocks, other } from './fixtures.js';

const createGroupTest = (description, fixtures) =>
  describe(description, () => {
    beforeAll(async () => {
      await ready;
    });
    for (const [testName, fixture] of Object.entries(fixtures)) {
      if (!fixture.throws) {
        test(testName, () => {
          const script = compileMiniscript(fixture.miniscript).asm;
          expect(script).toEqual(fixture.script);
        });
      }
    }
  });

createGroupTest('Primitives', primitives);
createGroupTest('Timelocks', timeLocks);
createGroupTest('Other', other);
