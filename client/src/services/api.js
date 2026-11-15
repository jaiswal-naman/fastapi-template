const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  listLabs: () => request('/labs'),
  createLab: (body) => request('/labs', { method: 'POST', body: JSON.stringify(body) }),
  getLab: (labId) => request(`/labs/${labId}`),
  updateLab: (labId, body) => request(`/labs/${labId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  saveTopology: (labId, topology) =>
    request(`/labs/${labId}/topology`, { method: 'PUT', body: JSON.stringify(topology) }),
  templates: () => request('/topologies/templates'),
  scenarios: () => request('/scenarios'),
  listExperiments: () => request('/experiments'),
  listLabExperiments: (labId) => request(`/labs/${labId}/experiments`),
  getExperiment: (id) => request(`/experiments/${id}`),
  saveExperiment: (labId, body) =>
    request(`/labs/${labId}/experiments`, { method: 'POST', body: JSON.stringify(body) }),
  encodeSignal: (body) => request('/signal/encode', { method: 'POST', body: JSON.stringify(body) }),
  channel: (body) => request('/channel/capacity', { method: 'POST', body: JSON.stringify(body) }),
  metrics: (labId) => request(`/labs/${labId}/metrics`),
};
