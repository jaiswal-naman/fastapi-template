import { nyquistCapacity, shannonCapacity, pcmBitRate, deltaModulation } from '../channel/channel.js';
import { num } from './format.js';

const CALC_COLUMNS = [
  { key: 'q', label: 'Quantity' },
  { key: 'f', label: 'Formula' },
  { key: 'w', label: 'Working', grow: true },
  { key: 'r', label: 'Result', align: 'right' },
];

const base = { group: 'channel', layer: { n: 1, name: 'Physical' }, kind: 'scope', lab: { to: '/channel-lab', label: 'Try your own numbers' } };

function nyquist() {
  const B = 3000;
  const four = nyquistCapacity({ bandwidthHz: B, levels: 4 });
  const eight = nyquistCapacity({ bandwidthHz: B, levels: 8 });
  const symbols = [0, 3, 1, 2, 3, 0, 2, 1];
  const pair = (s) => s.toString(2).padStart(2, '0');
  const facts = [
    { label: 'Formula', value: 'C = 2 × B × log2(M)' },
    { label: 'B', value: 'Bandwidth in hertz' },
    { label: 'M', value: 'Number of signal levels' },
    { label: 'Assumes', value: 'No noise at all' },
  ];
  return {
    ...base,
    id: 'nyquist',
    title: 'Nyquist capacity',
    subtitle: 'Top speed of a noiseless channel',
    overview: {
      text: 'A channel with bandwidth B can change its signal at most 2 × B times a second. Each change is called a symbol. If a symbol can take one of M levels, it carries log2(M) bits. Multiply the two and you have the fastest the channel can go when there is no noise.',
      facts,
    },
    columns: CALC_COLUMNS,
    legend: [{ tone: 'brand', label: 'Signal with 4 levels' }],
    steps: [
      { title: 'The channel', subtitle: 'How wide is it?', body: `Take a telephone-grade line that passes frequencies up to about ${num(B)} Hz. Its bandwidth B is ${num(B)} Hz. For now, pretend it has no noise.` },
      { title: 'Symbols per second', subtitle: 'How often can the signal change?', body: `Nyquist showed the signal can change at most 2 × B times each second. Here that is ${num(2 * B)} symbols per second.` },
      { title: 'Bits per symbol', subtitle: 'How much does one change say?', body: 'This signal uses M = 4 voltage levels. One of four values is two bits of information: 00, 01, 10 or 11. The labels above each symbol show the two bits it carries.' },
      { title: 'Capacity', subtitle: 'Multiply the two', body: `${num(2 * B)} symbols per second, each worth ${four.bitsPerSymbol} bits, gives ${num(four.capacityBps)} bits per second.` },
      { title: 'More levels?', subtitle: 'Where is the catch?', body: `With 8 levels each symbol carries 3 bits and the capacity rises to ${num(eight.capacityBps)} bps. So why not a thousand levels? Because the levels end up so close together that the slightest noise mixes them up. How far you can go is what Shannon's formula answers.` },
    ],
    scope: {
      slots: symbols.length,
      y: { min: -0.6, max: 3.6, ticks: [0, 1, 2, 3].map((v) => ({ v, label: pair(v) })) },
      top: { caption: 'Bits carried', labels: symbols.map(pair), progressive: true },
      traces: [{ id: 'wave', type: 'step', perSlot: 1, values: symbols, tone: 'brand', progressive: true }],
      marks: [],
    },
    frames: [
      { step: 0, show: { wave: 0, top: 0 }, note: 'An empty channel, ready to carry a signal.', row: { q: 'Bandwidth B', f: 'given', w: '', r: `${num(B)} Hz` }, detail: facts },
      { step: 1, show: { wave: 8, top: 0 }, note: 'Each flat piece of the trace is one symbol.', row: { q: 'Symbol rate', f: '2 × B', w: `2 × ${num(B)}`, r: `${num(2 * B)} symbols/s` }, detail: [{ label: 'Symbols shown', value: '8' }, { label: 'Symbol rate', value: `${num(2 * B)} per second` }] },
      { step: 2, show: { wave: 8, top: 8 }, note: 'Four possible heights, so each symbol is worth two bits.', row: { q: 'Bits per symbol', f: 'log2(M)', w: 'log2(4)', r: `${four.bitsPerSymbol} bits` }, detail: [{ label: 'Levels M', value: '4' }, { label: 'Bits per symbol', value: String(four.bitsPerSymbol) }] },
      { step: 3, show: { wave: 8, top: 8 }, note: 'Symbols per second times bits per symbol.', row: { tone: 'brand', q: 'Capacity C', f: '2 × B × log2(M)', w: `2 × ${num(B)} × ${four.bitsPerSymbol}`, r: `${num(four.capacityBps)} bps` }, detail: [{ label: 'Capacity', value: `${num(four.capacityBps)} bps` }, { label: 'In kbps', value: `${num(four.capacityKbps)} kbps` }] },
      { step: 4, show: { wave: 8, top: 8 }, note: 'More levels means more bits per symbol, until noise gets in the way.', row: { q: 'With M = 8', f: '2 × B × log2(8)', w: `2 × ${num(B)} × ${eight.bitsPerSymbol}`, r: `${num(eight.capacityBps)} bps` }, detail: [{ label: 'With 4 levels', value: `${num(four.capacityBps)} bps` }, { label: 'With 8 levels', value: `${num(eight.capacityBps)} bps` }] },
    ],
  };
}

function shannon() {
  const B = 3000;
  const good = shannonCapacity({ bandwidthHz: B, snrDb: 30 });
  const poor = shannonCapacity({ bandwidthHz: B, snrDb: 10 });
  const bits = [1, 0, 1, 1, 0, 1, 0, 0];
  // Noise amplitude relative to the signal amplitude: 1 / sqrt(power ratio).
  const band = (s) => 1 / Math.sqrt(s.snrLinear);
  const maxLevels = Math.floor(2 ** (good.capacityBps / (2 * B)));
  const facts = [
    { label: 'Formula', value: 'C = B × log2(1 + SNR)' },
    { label: 'SNR', value: 'Signal power ÷ noise power' },
    { label: 'From decibels', value: 'SNR = 10^(dB ÷ 10)' },
    { label: 'Meaning', value: 'No method can go faster' },
  ];
  const all = { wave: 8 };
  return {
    ...base,
    id: 'shannon',
    title: 'Shannon capacity',
    subtitle: 'Top speed when there is noise',
    overview: {
      text: 'Every real channel has noise. Shannon worked out the highest bit rate that can pass through a noisy channel with as few errors as you like. It depends on just two things: the bandwidth, and how much stronger the signal is than the noise, called the signal-to-noise ratio (SNR).',
      facts,
    },
    columns: CALC_COLUMNS,
    legend: [{ tone: 'brand', label: 'Signal' }, { tone: 'warn', label: 'Noise around it' }],
    steps: [
      { title: 'The channel', subtitle: 'Bandwidth and noise', body: `The same ${num(B)} Hz line, but now with noise. Its SNR is 30 dB. The shaded band around the signal shows how far noise can push it.` },
      { title: 'Decibels to a ratio', subtitle: 'What does 30 dB mean?', body: `Decibels are a short way to write a big ratio. 30 dB means the signal power is 10^(30 ÷ 10) = ${num(good.snrLinear)} times the noise power. The formula needs this plain ratio, not the dB value.` },
      { title: 'Capacity', subtitle: 'Put the numbers in', body: `C = ${num(B)} × log2(1 + ${num(good.snrLinear)}) = ${num(good.capacityBps, 0)} bps. No modem on this line can ever beat that.` },
      { title: 'A noisier line', subtitle: 'Drop the SNR to 10 dB', body: `Now the signal is only ${num(poor.snrLinear)} times the noise. The band is wide enough to blur the two levels together, and the capacity falls to ${num(poor.capacityBps, 0)} bps.` },
      { title: 'Nyquist and Shannon together', subtitle: 'Two limits, one channel', body: `Nyquist says how fast you can go for a given number of levels. Shannon says how many levels the noise will allow. At 30 dB this line cannot make use of more than about ${maxLevels} levels.` },
    ],
    scope: {
      slots: bits.length,
      y: { min: -1.7, max: 1.7, ticks: [{ v: 1, label: 'High' }, { v: -1, label: 'Low' }] },
      top: { caption: 'Bits', labels: bits.map(String) },
      traces: [{ id: 'wave', type: 'step', perSlot: 1, values: bits.map((b) => (b ? 1 : -1)), tone: 'brand', progressive: true }],
      marks: [],
      band: band(good),
    },
    frames: [
      { step: 0, show: all, note: 'A two-level signal on a line with 30 dB SNR.', row: { q: 'Bandwidth B', f: 'given', w: '', r: `${num(B)} Hz` }, detail: facts },
      { step: 0, show: all, note: 'The thin shaded band is the noise.', row: { q: 'SNR', f: 'given', w: '', r: '30 dB' }, detail: [{ label: 'Bandwidth', value: `${num(B)} Hz` }, { label: 'SNR', value: '30 dB' }] },
      { step: 1, show: all, note: 'Every 10 dB is a factor of ten in power.', row: { q: 'SNR as a ratio', f: '10^(dB ÷ 10)', w: '10^(30 ÷ 10)', r: num(good.snrLinear) }, detail: [{ label: '10 dB', value: '10 times' }, { label: '20 dB', value: '100 times' }, { label: '30 dB', value: '1,000 times' }] },
      { step: 2, show: all, note: 'This is the ceiling for the line.', row: { tone: 'brand', q: 'Capacity C', f: 'B × log2(1 + SNR)', w: `${num(B)} × log2(${num(1 + good.snrLinear)})`, r: `${num(good.capacityBps, 0)} bps` }, detail: [{ label: 'log2(1 + SNR)', value: num(Math.log2(1 + good.snrLinear), 3) }, { label: 'Capacity', value: `${num(good.capacityBps, 0)} bps` }] },
      { step: 3, show: all, band: band(poor), note: 'More noise, wider band, lower ceiling.', row: { tone: 'warn', q: 'At 10 dB', f: 'B × log2(1 + 10)', w: `${num(B)} × ${num(Math.log2(1 + poor.snrLinear), 3)}`, r: `${num(poor.capacityBps, 0)} bps` }, detail: [{ label: 'At 30 dB', value: `${num(good.capacityBps, 0)} bps` }, { label: 'At 10 dB', value: `${num(poor.capacityBps, 0)} bps` }] },
      { step: 4, show: all, note: 'Solve the Nyquist formula for M using the Shannon capacity.', row: { q: 'Levels worth using', f: '2^(C ÷ 2B)', w: `2^(${num(good.capacityBps, 0)} ÷ ${num(2 * B)})`, r: `about ${maxLevels}` }, detail: [{ label: 'Shannon limit', value: `${num(good.capacityBps, 0)} bps` }, { label: 'Levels worth using', value: `about ${maxLevels}` }] },
    ],
  };
}

function pcm() {
  const n = 8;
  const f = (t) => 3.5 + 2.6 * Math.sin((2 * Math.PI * t) / 8 - 0.5) + 0.7 * Math.sin((4 * Math.PI * t) / 8 + 0.8);
  const curve = [];
  for (let t = 0; t <= n + 1e-9; t += 0.1) curve.push([Number(t.toFixed(1)), f(t)]);
  const samples = Array.from({ length: n }, (_, i) => f(i + 0.5));
  const levels = samples.map((v) => Math.min(7, Math.max(0, Math.round(v))));
  const code = (l) => l.toString(2).padStart(3, '0');
  const phone = pcmBitRate({ bitsPerSample: 8, sampleRateHz: 8000 });
  const stream = levels.map(code).join(' ');
  const facts = [
    { label: 'Sampling rule', value: 'At least 2 × the highest frequency' },
    { label: 'Levels', value: '2^n for n bits per sample' },
    { label: 'Bit rate', value: 'R = n × fs' },
    { label: 'Telephone voice', value: `${num(phone.bitRateBps)} bps` },
  ];
  const frames = [
    { step: 0, show: {}, note: 'A smooth signal: it has a value at every instant.', detail: facts },
    { step: 1, show: { stems: n }, note: `${n} measurements, evenly spaced in time.`, detail: [{ label: 'Samples taken', value: String(n) }, { label: 'Spacing', value: 'Equal' }] },
  ];
  samples.forEach((v, i) => {
    const err = levels[i] - v;
    frames.push({
      step: 2,
      show: { stems: n, stair: i + 1, top: i + 1 },
      slot: i,
      note: `Sample ${i + 1} measures ${num(v)}. The nearest level is ${levels[i]}, which is ${code(levels[i])} in binary.`,
      row: { tone: 'brand', value: num(v), level: String(levels[i]), code: code(levels[i]), note: `Rounded ${err >= 0 ? 'up' : 'down'} by ${num(Math.abs(err))}` },
      detail: [
        { label: 'Sample', value: `${i + 1} of ${n}` },
        { label: 'Measured', value: num(v) },
        { label: 'Nearest level', value: String(levels[i]) },
        { label: 'Code', value: code(levels[i]) },
        { label: 'Rounding error', value: num(Math.abs(err)) },
      ],
    });
  });
  frames.push(
    { step: 3, show: { stems: n, stair: n, top: n }, note: `The digital signal: ${stream}.`, detail: [{ label: 'Bit stream', value: stream }, { label: 'Bits per sample', value: '3' }, { label: 'Total bits', value: String(n * 3) }] },
    {
      step: 4,
      show: { stems: n, stair: n, top: n },
      note: 'Bits per sample times samples per second.',
      row: { tone: 'violet', value: `${num(phone.sampleRateHz)} samples/s`, level: '256', code: '8 bits', note: `Telephone voice: 8 × ${num(phone.sampleRateHz)} = ${num(phone.bitRateBps)} bps` },
      detail: [{ label: 'Bits per sample n', value: '8' }, { label: 'Samples per second fs', value: num(phone.sampleRateHz) }, { label: 'Bit rate R', value: `${num(phone.bitRateBps)} bps` }],
    },
  );
  return {
    ...base,
    id: 'pcm',
    title: 'PCM',
    subtitle: 'Analog to digital: sample, round, code',
    overview: {
      text: 'Pulse code modulation turns a smooth analog signal, such as a voice, into bits. It measures the signal at regular moments (sampling), rounds each measurement to the nearest allowed level (quantizing), and writes that level as a binary number (coding).',
      facts,
    },
    columns: [
      { key: 'value', label: 'Measured' },
      { key: 'level', label: 'Nearest level' },
      { key: 'code', label: 'Code' },
      { key: 'note', label: 'Note', grow: true },
    ],
    legend: [{ tone: 'muted', label: 'Analog signal' }, { tone: 'info', label: 'Samples' }, { tone: 'brand', label: 'Rounded levels' }],
    steps: [
      { title: 'The analog signal', subtitle: 'Smooth and continuous', body: 'This curve is the signal, for example a sound wave picked up by a microphone. It has a value at every instant, and no digital system can store infinitely many values.' },
      { title: 'Sampling', subtitle: 'Measure at regular moments', body: `Measure the signal at evenly spaced moments. Here that gives ${n} samples. You must sample at least twice as fast as the highest frequency in the signal, or its shape is lost. That minimum is called the Nyquist rate.` },
      { title: 'Quantize and code', subtitle: 'Round each sample, write it in bits', body: 'With 3 bits there are only 8 allowed levels, 0 to 7. Each sample is rounded to the nearest one and written as a 3-bit number. The small rounding error is gone for good: it is called quantization noise.' },
      { title: 'The bit stream', subtitle: 'What actually gets sent', body: `Reading the codes in order gives the digital signal: ${stream}. The receiver turns each code back into a level and smooths the result.` },
      { title: 'The bit rate', subtitle: 'How many bits per second?', body: `Each sample costs n bits and there are fs samples every second, so R = n × fs. A phone call uses 8 bits per sample and ${num(phone.sampleRateHz)} samples per second: ${num(phone.bitRateBps)} bps.` },
    ],
    scope: {
      slots: n,
      y: { min: -0.6, max: 7.6, ticks: [0, 1, 2, 3, 4, 5, 6, 7].map((v) => ({ v, label: code(v) })) },
      top: { caption: 'Code', labels: levels.map(code), progressive: true },
      traces: [
        { id: 'curve', type: 'curve', points: curve, tone: 'muted' },
        { id: 'stair', type: 'step', perSlot: 1, values: levels, tone: 'brand', progressive: true },
        { id: 'stems', type: 'stems', points: samples.map((v, i) => [i + 0.5, v]), tone: 'info', progressive: true },
      ],
      marks: [],
    },
    frames,
  };
}

function delta() {
  // A steep climb (the staircase falls behind) followed by a flat stretch (it hunts up and down).
  const samples = [1, 1.4, 2.8, 5.0, 7.2, 8.2, 8.3, 8.2, 8.3, 8.2, 8.3, 8.2, 8.3, 8.2];
  const stepSize = 1;
  const r = deltaModulation({ samples, stepSize });
  const n = samples.length;
  const worst = Math.max(...samples.map((v, i) => Math.abs(v - r.reconstruction[i])));
  const stream = r.bitstream.join('');
  const facts = [
    { label: 'Bits per sample', value: '1' },
    { label: 'Step size', value: String(stepSize) },
    { label: 'Step too small', value: 'Falls behind steep parts' },
    { label: 'Step too large', value: 'Jitters around flat parts' },
  ];
  const frames = [
    { step: 0, show: { stems: n }, note: 'The signal, with a sample taken at each dot.', detail: facts },
    {
      step: 1,
      show: { stems: n, stair: 1, top: 1 },
      slot: 0,
      note: `The guess starts at the first sample, ${num(samples[0])}.`,
      row: { signal: num(samples[0]), before: '', bit: 'start', after: num(r.reconstruction[0]) },
      detail: [{ label: 'First sample', value: num(samples[0]) }, { label: 'Starting guess', value: num(r.reconstruction[0]) }],
    },
  ];
  for (let i = 1; i < n; i += 1) {
    const bit = r.bitstream[i - 1];
    const before = r.reconstruction[i - 1];
    const after = r.reconstruction[i];
    frames.push({
      step: 2,
      show: { stems: n, stair: i + 1, top: i + 1 },
      slot: i,
      note: bit
        ? `The signal (${num(samples[i])}) is above the guess (${num(before)}). Send 1 and step the guess up to ${num(after)}.`
        : `The signal (${num(samples[i])}) is below the guess (${num(before)}). Send 0 and step the guess down to ${num(after)}.`,
      row: { tone: bit ? 'brand' : 'violet', signal: num(samples[i]), before: num(before), bit: String(bit), after: num(after) },
      detail: [
        { label: 'Sample', value: `${i + 1} of ${n}` },
        { label: 'Signal', value: num(samples[i]) },
        { label: 'Guess before', value: num(before) },
        { label: 'Bit sent', value: `${bit} (${bit ? 'step up' : 'step down'})` },
        { label: 'Guess after', value: num(after) },
      ],
    });
  }
  frames.push({
    step: 3,
    show: { stems: n, stair: n, top: n },
    note: `Bits sent: ${stream}.`,
    detail: [{ label: 'Bits sent', value: stream }, { label: 'Bits per sample', value: '1' }, { label: 'Largest gap', value: num(worst) }],
  });
  return {
    ...base,
    id: 'delta-modulation',
    title: 'Delta modulation',
    subtitle: 'One bit per sample: up or down',
    overview: {
      text: 'Delta modulation sends a single bit for each sample. The receiver keeps a running guess of the signal. Each bit only says whether the real signal is above the guess (1, step up) or below it (0, step down). The guess becomes a staircase that chases the signal.',
      facts,
    },
    columns: [
      { key: 'signal', label: 'Signal' },
      { key: 'before', label: 'Guess before' },
      { key: 'bit', label: 'Bit sent' },
      { key: 'after', label: 'Guess after', grow: true },
    ],
    legend: [{ tone: 'muted', label: 'Analog signal' }, { tone: 'brand', label: 'Staircase guess' }],
    steps: [
      { title: 'The signal', subtitle: 'Sampled at regular moments', body: 'The curve is the analog signal. Instead of describing each sample with a full number as PCM does, delta modulation will describe it with one bit.' },
      { title: 'The starting guess', subtitle: 'Both sides agree on it', body: `Sender and receiver start with the same guess. Here it is the first sample, ${num(samples[0])}.` },
      { title: 'Up or down', subtitle: 'One bit per sample', body: `At each sample, compare the signal with the guess. Above: send 1 and raise the guess by ${stepSize}. Below: send 0 and lower it by ${stepSize}.` },
      { title: 'What the receiver rebuilds', subtitle: 'A staircase', body: `The staircase is all the receiver has. Where the signal climbed steeply, the staircase could only rise one step at a time and fell up to ${num(worst)} behind: that is slope overload. Where the signal was flat, the staircase kept stepping above and below it: that is granular noise.` },
    ],
    scope: {
      slots: n,
      y: { min: 0, max: 10, ticks: [0, 2, 4, 6, 8, 10].map((v) => ({ v, label: String(v) })) },
      top: { caption: 'Bit sent', labels: ['start', ...r.bitstream.map(String)], progressive: true },
      traces: [
        { id: 'curve', type: 'curve', points: samples.map((v, i) => [i + 0.5, v]), smooth: true, tone: 'muted' },
        { id: 'stair', type: 'step', perSlot: 1, values: r.reconstruction, tone: 'brand', progressive: true },
        { id: 'stems', type: 'stems', points: samples.map((v, i) => [i + 0.5, v]), tone: 'info', progressive: true },
      ],
      marks: [],
    },
    frames,
  };
}

export function buildChannelLessons() {
  return [nyquist(), shannon(), pcm(), delta()];
}
