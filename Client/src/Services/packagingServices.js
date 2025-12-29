export async function fetchPackaging() {
  const res = await fetch('/api/packaging');
  if (!res.ok) throw new Error('Failed to fetch packaging');
  return res.json();
}

export async function addPackaging(packaging) {
  const res = await fetch('/api/packaging', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packaging)
  });
  if (!res.ok) throw new Error('Failed to add packaging');
  return res.json();
}

export async function editPackaging(packaging) {
  const res = await fetch(`/api/packaging/${packaging.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packaging)
  });
  if (!res.ok) throw new Error('Failed to edit packaging');
  return res.json();
}

export async function deletePackaging(id) {
  const res = await fetch(`/api/packaging/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete packaging');
  return res.json();
}
