import React, { useState } from 'react';
import MapComponent from './components/Map';
import PointList from './components/PointList';
import { calculateRoute } from './services/api';
import './App.css';

type Point = [number, number]; // [lng, lat]

function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addPoint = (coord: [number, number]) => {
    setPoints(prev => [...prev, coord]);
    setRoute(null);
  };

  const removePoint = (index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
    setRoute(null);
  };

  const reorderPoints = (newPoints: Point[]) => {
    setPoints(newPoints);
    setRoute(null);
  };

  const handleCalculateRoute = async () => {
    if (points.length < 2) return;
    setLoading(true);
    try {
      const waypoints = points.map(([lng, lat]) => ({ lat, lng }));
      const result = await calculateRoute(waypoints);
      setRoute(result);
    } catch (error) {
      console.error('Erro ao calcular rota', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚚 Otimizador de Rotas</h1>
        <p>Clique no mapa para adicionar pontos de entrega</p>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <PointList
            points={points}
            onRemove={removePoint}
            onReorder={reorderPoints}
            onCalculate={handleCalculateRoute}
            loading={loading}
          />
        </aside>
        <main className="map-container">
          <MapComponent onAddPoint={addPoint} points={points} route={route} />
        </main>
      </div>
    </div>
  );
}

export default App;