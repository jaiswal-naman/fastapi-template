/**
 * Line coding encoders.
 * Manchester IEEE 802.3: 0 = high→low, 1 = low→high (mid-bit transition).
 * Differential Manchester: mid-bit always; 0 = transition at start; 1 = no start transition.
 */

function assertBinary(bits) {
  if (typeof bits !== 'string' || !/^[01]+$/.test(bits)) {
    throw new Error('Input must be a non-empty binary string of 0 and 1.');
  }
}

function baseResult(bits, scheme, convention, levels, transitions, substitutions, explanation) {
  return {
    bits: bits.split('').map(Number),
    scheme,
    convention,
    levels,
    transitions,
    substitutions,
    explanation,
  };
}

export function encodeUnipolarNrz(bits) {
  assertBinary(bits);
  const levels = [];
  for (const b of bits) levels.push(b === '1' ? 1 : 0, b === '1' ? 1 : 0);
  return baseResult(bits, 'unipolar_nrz', 'high=1, low=0', levels, [], [], '1 = +V for full bit; 0 = 0V for full bit.');
}

export function encodePolarNrzL(bits) {
  assertBinary(bits);
  const levels = [];
  for (const b of bits) levels.push(b === '1' ? 1 : -1, b === '1' ? 1 : -1);
  return baseResult(bits, 'polar_nrz_l', '1=+V, 0=-V', levels, [], [], 'NRZ-L: level encodes the bit for the full interval.');
}

export function encodePolarNrzI(bits) {
  assertBinary(bits);
  const levels = [];
  let level = 1;
  const transitions = [];
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === '1') {
      level = -level;
      transitions.push({ bitIndex: i, at: 'start', reason: '1 causes inversion' });
    }
    levels.push(level, level);
  }
  return baseResult(bits, 'polar_nrz_i', 'invert on 1', levels, transitions, [], 'NRZ-I: transition at start of bit for 1; no change for 0.');
}

export function encodePolarRz(bits) {
  assertBinary(bits);
  const levels = [];
  for (const b of bits) {
    levels.push(b === '1' ? 1 : -1, 0);
  }
  return baseResult(bits, 'polar_rz', 'half-bit return to zero', levels, [], [], 'Polar RZ: first half carries ±V; second half returns to 0.');
}

export function encodeManchester(bits) {
  assertBinary(bits);
  const convention = 'IEEE 802.3: 0=high→low, 1=low→high';
  const levels = [];
  const transitions = [];
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === '0') {
      levels.push(1, -1);
    } else {
      levels.push(-1, 1);
    }
    transitions.push({ bitIndex: i, at: 'mid', reason: 'Manchester mid-bit transition' });
  }
  return baseResult(bits, 'manchester', convention, levels, transitions, [], convention);
}

export function encodeDiffManchester(bits) {
  assertBinary(bits);
  const convention = 'Mid-bit always; 0=transition at start; 1=no start transition';
  const levels = [];
  const transitions = [];
  let level = 1; // idle high before first bit
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === '0') {
      level = -level;
      transitions.push({ bitIndex: i, at: 'start', reason: '0 → start transition' });
    }
    // mid-bit transition always
    const first = level;
    level = -level;
    transitions.push({ bitIndex: i, at: 'mid', reason: 'always mid-bit transition' });
    levels.push(first, level);
  }
  return baseResult(bits, 'differential_manchester', convention, levels, transitions, [], convention);
}

export function encodeAmi(bits) {
  assertBinary(bits);
  const levels = [];
  let lastOne = -1;
  for (const b of bits) {
    if (b === '0') {
      levels.push(0, 0);
    } else {
      lastOne = -lastOne;
      levels.push(lastOne, lastOne);
    }
  }
  return baseResult(bits, 'ami', 'alternate mark inversion', levels, [], [], 'AMI: 0=0V; 1=alternating ±V.');
}

export function encodePseudoternary(bits) {
  assertBinary(bits);
  const levels = [];
  let lastZero = -1;
  for (const b of bits) {
    if (b === '1') {
      levels.push(0, 0);
    } else {
      lastZero = -lastZero;
      levels.push(lastZero, lastZero);
    }
  }
  return baseResult(bits, 'pseudoternary', 'zeros alternate', levels, [], [], 'Pseudoternary: 1=0V; 0=alternating ±V.');
}

export function encodeB8zs(bits) {
  assertBinary(bits);
  // AMI with B8ZS substitution for eight zeros: 000V B0VB where V violates, B follows AMI
  const levels = [];
  const substitutions = [];
  let lastOne = -1; // last pulse polarity
  let i = 0;
  while (i < bits.length) {
    if (bits.slice(i, i + 8) === '00000000') {
      // Standard B8ZS: if last pulse was +, substitute 000+-0-+ ; if -, 000-+0+-
      const pattern = lastOne === 1 ? [0, 0, 0, 1, -1, 0, -1, 1] : [0, 0, 0, -1, 1, 0, 1, -1];
      for (const v of pattern) {
        levels.push(v, v);
        if (v !== 0) lastOne = v;
      }
      substitutions.push({
        startBit: i,
        length: 8,
        pattern: pattern.join(','),
        rule: 'B8ZS eight-zero substitution',
      });
      i += 8;
      continue;
    }
    const b = bits[i];
    if (b === '0') {
      levels.push(0, 0);
    } else {
      lastOne = -lastOne;
      levels.push(lastOne, lastOne);
    }
    i += 1;
  }
  return baseResult(bits, 'b8zs', 'AMI + B8ZS', levels, [], substitutions, 'B8ZS replaces eight consecutive zeros with a bipolar violation pattern.');
}

export function encodeHdb3(bits) {
  assertBinary(bits);
  // HDB3: after 3 zeros, substitute 000V or B00V depending on number of bipolar pulses since last substitution
  const levels = [];
  const substitutions = [];
  let lastOne = -1;
  let onesSinceSubst = 0;
  let i = 0;
  while (i < bits.length) {
    if (bits.slice(i, i + 4) === '0000') {
      let pattern;
      if (onesSinceSubst % 2 === 0) {
        // B00V — B same polarity as previous, V same as B
        const b = lastOne; // same as previous pulse polarity for balancing? Actually B is opposite of last? Standard: B has same polarity as previous pulse to balance? 
        // Common teaching form: if odd number of 1s since last subst → 000V; if even → B00V
        // When even: B00V where B = -lastOne (so B is a balancing pulse), V = B
        const B = -lastOne;
        pattern = [B, 0, 0, B];
        lastOne = B;
      } else {
        const V = lastOne; // violation: same polarity as last
        pattern = [0, 0, 0, V];
        lastOne = V;
      }
      for (const v of pattern) levels.push(v, v);
      substitutions.push({
        startBit: i,
        length: 4,
        pattern: pattern.join(','),
        rule: onesSinceSubst % 2 === 0 ? 'HDB3 B00V' : 'HDB3 000V',
      });
      onesSinceSubst = 0;
      i += 4;
      continue;
    }
    const b = bits[i];
    if (b === '0') {
      levels.push(0, 0);
    } else {
      lastOne = -lastOne;
      levels.push(lastOne, lastOne);
      onesSinceSubst += 1;
    }
    i += 1;
  }
  return baseResult(bits, 'hdb3', 'AMI + HDB3', levels, [], substitutions, 'HDB3 substitutes four consecutive zeros using 000V or B00V.');
}

export const ENCODERS = {
  unipolar_nrz: encodeUnipolarNrz,
  polar_nrz_l: encodePolarNrzL,
  polar_nrz_i: encodePolarNrzI,
  polar_rz: encodePolarRz,
  manchester: encodeManchester,
  differential_manchester: encodeDiffManchester,
  ami: encodeAmi,
  pseudoternary: encodePseudoternary,
  b8zs: encodeB8zs,
  hdb3: encodeHdb3,
};

export function encode(scheme, bits) {
  const fn = ENCODERS[scheme];
  if (!fn) throw new Error(`Unknown encoding scheme: ${scheme}`);
  return fn(bits);
}
