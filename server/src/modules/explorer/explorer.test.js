import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getExplorer, GROUPS } from './index.js';

const { lessons } = getExplorer();
const byId = (id) => lessons.find((l) => l.id === id);

describe('explorer lessons', () => {
  it('builds every lesson with a complete shape', () => {
    assert.equal(lessons.length, 23);
    assert.equal(new Set(lessons.map((l) => l.id)).size, lessons.length);
    for (const l of lessons) {
      assert.ok(GROUPS.some((g) => g.id === l.group), `${l.id}: group`);
      assert.ok(l.title && l.subtitle && l.overview.text && l.overview.facts.length, `${l.id}: overview`);
      assert.ok(l.frames.length > l.steps.length - 1, `${l.id}: frames`);
      for (const [i, s] of l.steps.entries()) {
        assert.ok(s.title && s.subtitle && s.body, `${l.id}: step ${i} text`);
        assert.ok(l.frames.some((f) => f.step === i), `${l.id}: step ${i} has no frame`);
      }
      let last = 0;
      for (const f of l.frames) {
        assert.ok(f.step >= last && f.step < l.steps.length, `${l.id}: step order`);
        last = f.step;
        assert.ok(f.note && f.detail?.length, `${l.id}: frame text`);
        if (f.row) for (const c of l.columns) assert.notEqual(f.row[c.key], undefined, `${l.id}: row.${c.key}`);
      }
    }
  });

  it('never uses an em dash or leaves a placeholder in the text', () => {
    const text = JSON.stringify(lessons);
    assert.ok(!/[–—]/.test(text));
    assert.ok(!/undefined|NaN|\[object/.test(text));
  });

  it('is deterministic', () => {
    const strip = (s) => s.replace(/"createdAt":"[^"]+"/g, '');
    assert.equal(strip(JSON.stringify(getExplorer())), strip(JSON.stringify(getExplorer())));
  });

  it('TCP handshake runs SYN, SYN-ACK, ACK, data, ACK over two hops each', () => {
    const kinds = byId('tcp-handshake').frames.filter((f) => f.hop).map((f) => f.hop.kind);
    assert.deepEqual(kinds, ['SYN', 'SYN', 'SYN-ACK', 'SYN-ACK', 'ACK', 'ACK', 'DATA', 'DATA', 'ACK', 'ACK']);
  });

  it('TCP retransmission loses the data once, times out, then delivers', () => {
    const l = byId('tcp-retransmit');
    const lost = l.frames.filter((f) => f.hop?.lost);
    assert.equal(lost.length, 1);
    assert.equal(lost[0].hop.kind, 'DATA');
    const types = l.frames.filter((f) => f.row).map((f) => f.row.type);
    assert.ok(types.indexOf('TIMEOUT') > types.indexOf('DATA'));
    assert.match(l.frames.at(-1).note, /has the message/);
  });

  it('UDP delivers on a clean cable and silently loses on a bad one', () => {
    const l = byId('udp');
    assert.equal(l.frames.filter((f) => f.hop?.lost).length, 1);
    assert.ok(!l.frames.some((f) => f.row?.type === 'TIMEOUT'));
    assert.match(l.frames.at(-1).note, /never receives/);
  });

  it('ring and mesh reroute around a broken link; star and bus cannot', () => {
    for (const id of ['topology-ring', 'topology-mesh']) {
      const l = byId(id);
      const rerouted = l.frames.filter((f) => f.failed.length && f.hop);
      assert.ok(rerouted.length > 0, id);
      assert.ok(rerouted.every((f) => !f.failed.includes(f.hop.linkId)), id);
    }
    for (const id of ['topology-star', 'topology-bus']) {
      const l = byId(id);
      assert.ok(!l.frames.some((f) => f.failed.length && f.hop), id);
    }
  });

  it('routing compares two different paths', () => {
    const [a, b] = byId('routing').frames[0].candidates;
    assert.notDeepEqual(a.linkIds, b.linkIds);
  });

  it('line-code lessons reveal one bit per frame', () => {
    const l = byId('manchester');
    const bitFrames = l.frames.filter((f) => f.slot != null);
    assert.equal(bitFrames.length, l.scope.slots);
    assert.deepEqual(bitFrames.map((f) => f.show.wave), bitFrames.map((_, i) => i + 1));
    assert.equal(byId('b8zs').scope.marks.map((m) => m.text).join(''), 'VBVB');
    assert.equal(byId('hdb3').scope.marks.map((m) => m.text).join(''), 'BVV');
  });
});
