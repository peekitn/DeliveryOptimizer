import axios from 'axios';

interface GeocodeResult {
  lat: number;
  lon: number;
  display_name: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'DeliveryOptimizer/1.0 (seu-email@exemplo.com)', // Substitua
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Erro no geocoding:', error);
    throw new Error('Falha ao buscar endereço');
  }
}