/** Plain-number formatting for lesson text: 12000 -> "12,000", 0.1084 -> "0.108 ms". */
export const num = (n, digits = 2) =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });

export const ms = (n) => `${Number(n).toFixed(3)} ms`;
