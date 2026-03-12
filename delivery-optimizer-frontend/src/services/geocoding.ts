// Serviço de geocoding usando Nominatim (OpenStreetMap)
export async function searchAddress(query: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'OtimizadorRotas/1.0 (seu-email@exemplo.com)', // Substitua por um email válido
    },
  });
  if (!response.ok) throw new Error('Erro na geocodificação');
  const data = await response.json();
  if (data.length === 0) return null;
  const { lon, lat } = data[0];
  return [parseFloat(lon), parseFloat(lat)];
}