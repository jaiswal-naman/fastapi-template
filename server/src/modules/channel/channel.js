/**
 * Channel capacity and sampling helpers. Units must stay consistent.
 */

export function nyquistCapacity({ bandwidthHz, levels }) {
  if (!(bandwidthHz > 0) || !(levels >= 2)) {
    throw new Error('Nyquist requires bandwidthHz > 0 and levels >= 2.');
  }
  const bitsPerSymbol = Math.log2(levels);
  const capacityBps = 2 * bandwidthHz * bitsPerSymbol;
  return {
    formula: 'C = 2B log2(M)',
    bandwidthHz,
    levels,
    bitsPerSymbol,
    capacityBps,
    capacityKbps: capacityBps / 1e3,
    capacityMbps: capacityBps / 1e6,
  };
}

export function shannonCapacity({ bandwidthHz, snrDb }) {
  if (!(bandwidthHz > 0) || !Number.isFinite(snrDb)) {
    throw new Error('Shannon requires bandwidthHz > 0 and finite SNR dB.');
  }
  const snrLinear = 10 ** (snrDb / 10);
  const capacityBps = bandwidthHz * Math.log2(1 + snrLinear);
  return {
    formula: 'C = B log2(1 + SNR_linear)',
    bandwidthHz,
    snrDb,
    snrLinear,
    capacityBps,
    capacityKbps: capacityBps / 1e3,
    capacityMbps: capacityBps / 1e6,
  };
}

export function pcmBitRate({ bitsPerSample, sampleRateHz }) {
  if (!(bitsPerSample >= 1) || !(sampleRateHz > 0)) {
    throw new Error('PCM requires bitsPerSample >= 1 and sampleRateHz > 0.');
  }
  const bitRateBps = bitsPerSample * sampleRateHz;
  return {
    formula: 'R = n × fs',
    bitsPerSample,
    sampleRateHz,
    bitRateBps,
    bitRateKbps: bitRateBps / 1e3,
  };
}

export function deltaModulation({ samples, stepSize }) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('Delta Modulation requires a non-empty samples array.');
  }
  if (!(stepSize > 0)) throw new Error('stepSize must be > 0.');

  let estimate = samples[0];
  const bitstream = [];
  const reconstruction = [estimate];

  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i] >= estimate) {
      bitstream.push(1);
      estimate += stepSize;
    } else {
      bitstream.push(0);
      estimate -= stepSize;
    }
    reconstruction.push(estimate);
  }

  return {
    formula: 'staircase ± stepSize',
    stepSize,
    bitstream,
    reconstruction,
    inputSamples: samples,
  };
}
