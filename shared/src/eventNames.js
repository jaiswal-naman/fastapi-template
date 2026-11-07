/** Socket.IO and domain event names — keep client, server, docs in sync. */

export const ClientEvents = Object.freeze({
  LAB_JOIN: 'lab:join',
  LAB_LEAVE: 'lab:leave',
  TOPOLOGY_UPDATE: 'topology:update',
  NODE_FAILURE_SET: 'node:failure:set',
  LINK_FAILURE_SET: 'link:failure:set',
  PACKET_TRANSMIT: 'packet:transmit',
  SIMULATION_PAUSE: 'simulation:pause',
  SIMULATION_RESUME: 'simulation:resume',
  SIMULATION_RESET: 'simulation:reset',
});

export const ServerEvents = Object.freeze({
  LAB_JOINED: 'lab:joined',
  TOPOLOGY_UPDATED: 'topology:updated',
  PACKET_CREATED: 'packet:created',
  PACKET_ROUTE: 'packet:route',
  PACKET_QUEUED: 'packet:queued',
  PACKET_HOP: 'packet:hop',
  PACKET_DROPPED: 'packet:dropped',
  PACKET_RETRANSMIT: 'packet:retransmit',
  PACKET_ACK: 'packet:ack',
  PACKET_DELIVERED: 'packet:delivered',
  METRICS_UPDATE: 'metrics:update',
  SIMULATION_ERROR: 'simulation:error',
  SIMULATION_STATE: 'simulation:state',
});

/** Timeline / engine event types stored on packets */
export const PacketEventTypes = Object.freeze({
  CREATED: 'packet.created',
  ROUTE_COMPUTED: 'route.computed',
  QUEUED: 'packet.queued',
  FORWARDED: 'packet.forwarded',
  DROPPED: 'packet.dropped',
  ACKNOWLEDGED: 'packet.acknowledged',
  DELIVERED: 'packet.delivered',
  RETRANSMIT: 'packet.retransmit',
  SYN: 'tcp.syn',
  SYN_ACK: 'tcp.syn_ack',
  ACK: 'tcp.ack',
});

export const Protocols = Object.freeze({
  TCP_SIM: 'TCP_SIM',
  UDP_SIM: 'UDP_SIM',
});

export const DeviceTypes = Object.freeze({
  PC: 'pc',
  ROUTER: 'router',
  SWITCH: 'switch',
  SERVER: 'server',
  HUB: 'hub',
});

export const SimulationStatuses = Object.freeze({
  IDLE: 'idle',
  READY: 'ready',
  VALIDATING: 'validating',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const PacketStatuses = Object.freeze({
  CREATED: 'created',
  IN_TRANSIT: 'in_transit',
  QUEUED: 'queued',
  DELIVERED: 'delivered',
  DROPPED: 'dropped',
  TIMED_OUT: 'timed_out',
  RETRANSMITTING: 'retransmitting',
});
