const API_URL = 'http://localhost:3000/api';

export async function calculateRoute(waypoints: { lat: number; lng: number }[]) {
  const response = await fetch(`${API_URL}/routes/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waypoints }),
  });
  if (!response.ok) throw new Error('Erro na requisição');
  return response.json();
}