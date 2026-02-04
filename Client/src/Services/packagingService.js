import axios from 'axios';

const PACKAGING_API = '/api/packaging';

export async function fetchPackaging() {
  const response = await axios.get(PACKAGING_API);
  return response.data;
}

export async function addPackaging(packaging) {
  const response = await axios.post(PACKAGING_API, packaging);
  return response.data;
}

export async function editPackaging(packaging) {
  const response = await axios.put(`${PACKAGING_API}/${packaging.id}`, packaging);
  return response.data;
}

export async function deletePackaging(id) {
  const response = await axios.delete(`${PACKAGING_API}/${id}`);
  return response.data;
}
