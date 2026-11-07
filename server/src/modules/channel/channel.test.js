import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nyquistCapacity, shannonCapacity, pcmBitRate } from './channel.js';

describe('channel formulas', () => {
  it('nyquist', () => {
    const r = nyquistCapacity({ bandwidthHz: 3000, levels: 4 });
    assert.equal(r.capacityBps, 12000);
  });

  it('shannon uses linear SNR', () => {
    const r = shannonCapacity({ bandwidthHz: 3000, snrDb: 30 });
    assert.ok(r.snrLinear > 900 && r.snrLinear < 1100);
    assert.ok(r.capacityBps > 0);
  });

  it('pcm bit rate', () => {
    const r = pcmBitRate({ bitsPerSample: 8, sampleRateHz: 8000 });
    assert.equal(r.bitRateBps, 64000);
  });
});
