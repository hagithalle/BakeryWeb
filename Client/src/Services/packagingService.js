import api from './api';

const PACKAGING_API = '/api/packaging';

export async function fetchPackaging() {
  const response = await api.get(PACKAGING_API);
  return response.data;
}

export async function addPackaging(packaging) {
  const response = await api.post(PACKAGING_API, packaging);
  return response.data;
}

export async function editPackaging(packaging) {
  const response = await api.put(`${PACKAGING_API}/${packaging.id}`, packaging);
  return response.data;
}

export async function deletePackaging(id) {
  const response = await api.delete(`${PACKAGING_API}/${id}`);
  return response.data;
}
