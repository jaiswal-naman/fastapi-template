export const MAX_PAYLOAD_CHARS = 2048;
export const DEFAULT_PROPAGATION_SPEED_MPS = 2e8; // ~2/3 c in copper
export const DEFAULT_PROCESSING_DELAY_MS = 0.1;
export const DEFAULT_QUEUE_CAPACITY = 64;
export const DEFAULT_BANDWIDTH_MBPS = 100;
export const DEFAULT_DISTANCE_KM = 1;
export const DEFAULT_LOSS_PROBABILITY = 0;
export const TCP_MAX_RETRIES = 3;
export const TCP_RTO_FLOOR_MS = 50;
export const REFERENCE_FRAME_BYTES = 1500;
export const DOC_IP_PREFIXES = ['192.0.2.', '198.51.100.', '203.0.113.'];

export const DESIGN_TOKENS = Object.freeze({
  primaryEmerald: '#10B981',
  deepEmerald: '#047857',
  brightAccent: '#34D399',
  mainBackground: '#071A16',
  surface: '#0D2620',
  elevatedSurface: '#12352B',
  mainText: '#F0FDF4',
  secondaryText: '#A7C4B8',
  border: '#285344',
  warning: '#FBBF24',
  error: '#FB7185',
  info: '#60A5FA',
});
