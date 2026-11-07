import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeManchester, encodeB8zs, encodeUnipolarNrz } from './encoders.js';

describe('encoders', () => {
  it('rejects non-binary', () => {
    assert.throws(() => encodeUnipolarNrz('102'), /binary/);
  });

  it('manchester mid-bit transitions', () => {
    const r = encodeManchester('01');
    assert.deepEqual(r.levels, [1, -1, -1, 1]);
    assert.match(r.convention, /IEEE 802\.3/);
  });

  it('b8zs substitutes eight zeros', () => {
    const r = encodeB8zs('00000000');
    assert.equal(r.substitutions.length, 1);
    assert.equal(r.levels.length, 16);
  });
});
