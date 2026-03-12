import React, { useState } from 'react';
import MapComponent from './components/Map';
import PointList from './components/PointList';
import { calculateRoute } from './services/api';
import './App.css';

type Point = [number, number]; // [lng, lat]

function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [route, setRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const addPoint = (coord: [number, number]) => {
    setPoints(prev => [...prev, coord]);
    setRoute(null);
    setRouteInfo(null);
  };

  const removePoint = (index: number) => {
    setPoints(prev => prev.filter((_, i) => i !== index));
    setRoute(null);
    setRouteInfo(null);
  };

  const reorderPoints = (newPoints: Point[]) => {
    setPoints(newPoints);
    setRoute(null);
    setRouteInfo(null);
  };

  const handleCalculateRoute = async () => {
    if (points.length < 2) return;
    setLoading(true);
    try {
      const waypoints = points.map(([lng, lat]) => ({ lat, lng }));
      const result = await calculateRoute(waypoints);
      setRoute(result.geometry);
      setRouteInfo({
        distanceKm: result.distanceKm,
        durationMin: result.durationMin,
      });
    } catch (error) {
      console.error('Erro ao calcular rota', error);
      alert('Não foi possível calcular a rota. Tente outros pontos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚚 Otimizador de Rotas</h1>
        <p>Clique no mapa ou busque por endereço para adicionar pontos</p>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <PointList
            points={points}
            onRemove={removePoint}
            onReorder={reorderPoints}
            onCalculate={handleCalculateRoute}
            onAddPoint={addPoint}          // nova prop para geocoding
            loading={loading}
            routeInfo={routeInfo}           // exibe distância e tempo
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