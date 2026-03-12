import React, { useState } from 'react';

interface SearchBarProps {
  onSearchResult: (lat: number, lng: number, displayName: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResult }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3000/api/geocode/search?address=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Erro na busca');
      const data = await response.json();
      if (data) {
        onSearchResult(data.lat, data.lon, data.display_name);
        setQuery('');
      } else {
        setError('Endereço não encontrado');
      }
    } catch (err) {
      setError('Falha na busca');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Digite um endereço..."
        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch} disabled={loading} style={{ padding: '0.5rem 1rem' }}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
};

export default SearchBar; 