/**
 * Rolling metrics aggregator driven only by simulation results.
 */
export function createMetricsStore() {
  const samples = [];
  let totals = {
    sent: 0,
    delivered: 0,
    dropped: 0,
    retransmits: 0,
    payloadBitsDelivered: 0,
  };
  const latencies = [];

  function applyDelta(delta, timestamp = Date.now()) {
    totals.sent += delta.sent || 0;
    totals.delivered += delta.delivered || 0;
    totals.dropped += delta.dropped || 0;
    totals.retransmits += delta.retransmits || 0;
    totals.payloadBitsDelivered += delta.payloadBitsDelivered || 0;
    if (delta.latencyMs != null) latencies.push(delta.latencyMs);

    const windowMs = 10_000;
    const throughputBps =
      samples.length > 0
        ? (totals.payloadBitsDelivered / Math.max(1, (timestamp - samples[0].timestamp) / 1000))
        : 0;

    const snapshot = {
      timestamp,
      label: 'Simulated',
      sent: totals.sent,
      delivered: totals.delivered,
      dropped: totals.dropped,
      retransmits: totals.retransmits,
      deliveryRatioPct: totals.sent ? (totals.delivered / totals.sent) * 100 : 0,
      lossPct: totals.sent ? (totals.dropped / totals.sent) * 100 : 0,
      averageLatencyMs: latencies.length
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : null,
      currentLatencyMs: delta.latencyMs ?? null,
      jitterMs: computeJitter(latencies),
      throughputBps,
      throughputMbps: throughputBps / 1e6,
      delays: delta.delays || null,
    };

    samples.push(snapshot);
    // keep last 200 samples
    while (samples.length > 200) samples.shift();
    // prune old for throughput window tracking
    while (samples.length && timestamp - samples[0].timestamp > windowMs * 6) {
      // keep history for charts; do not erase totals
      break;
    }
    return snapshot;
  }

  function reset() {
    samples.length = 0;
    latencies.length = 0;
    totals = { sent: 0, delivered: 0, dropped: 0, retransmits: 0, payloadBitsDelivered: 0 };
  }

  function getSnapshot() {
    return samples[samples.length - 1] || {
      timestamp: Date.now(),
      label: 'Simulated',
      sent: 0,
      delivered: 0,
      dropped: 0,
      retransmits: 0,
      deliveryRatioPct: 0,
      lossPct: 0,
      averageLatencyMs: null,
      currentLatencyMs: null,
      jitterMs: null,
      throughputBps: 0,
      throughputMbps: 0,
      delays: null,
    };
  }

  function getHistory() {
    return [...samples];
  }

  return { applyDelta, reset, getSnapshot, getHistory };
}

/** Mean absolute difference between consecutive latencies */
export function computeJitter(latencies) {
  if (!latencies || latencies.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < latencies.length; i += 1) {
    sum += Math.abs(latencies[i] - latencies[i - 1]);
  }
  return sum / (latencies.length - 1);
}
