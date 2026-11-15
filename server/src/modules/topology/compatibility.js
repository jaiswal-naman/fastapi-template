import { DeviceTypes } from '@datacompredia/shared';

const ENDPOINTS = new Set([DeviceTypes.PC, DeviceTypes.SERVER]);
const MULTIPORT = new Set([DeviceTypes.SWITCH, DeviceTypes.HUB, DeviceTypes.ROUTER]);

/**
 * Returns whether two device types may be directly linked.
 * Documented in docs/ASSUMPTIONS_AND_DECISIONS.md.
 */
export function areDevicesCompatible(typeA, typeB) {
  if (!typeA || !typeB) return false;
  if (typeA === typeB) {
    return MULTIPORT.has(typeA);
  }
  if (ENDPOINTS.has(typeA) && ENDPOINTS.has(typeB)) return false;
  if (ENDPOINTS.has(typeA) && MULTIPORT.has(typeB)) return true;
  if (ENDPOINTS.has(typeB) && MULTIPORT.has(typeA)) return true;
  if (MULTIPORT.has(typeA) && MULTIPORT.has(typeB)) return true;
  return false;
}

export function validateLinkEndpoints(nodesById, sourceId, targetId) {
  if (sourceId === targetId) {
    return { ok: false, message: 'Self-links are not allowed.' };
  }
  const source = nodesById.get(sourceId);
  const target = nodesById.get(targetId);
  if (!source || !target) {
    return { ok: false, message: 'Both endpoints must exist.' };
  }
  if (!areDevicesCompatible(source.type, target.type)) {
    return {
      ok: false,
      message: `Incompatible devices: ${source.type} cannot connect directly to ${target.type}.`,
    };
  }
  return { ok: true };
}
