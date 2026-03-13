import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { SortableItem } from './SortableItem';
import { searchAddress } from '../services/geocoding';
import './PointList.css';

interface PointListProps {
  points: [number, number][];
  onRemove: (index: number) => void;
  onReorder: (newPoints: [number, number][]) => void;
  onCalculate: () => void;
  onAddPoint: (coord: [number, number]) => void;
  loading: boolean;
  routeInfo: { distanceKm: number; durationMin: number; profile: string } | null;
  profile: 'car' | 'bike' | 'foot';
  onProfileChange: (profile: 'car' | 'bike' | 'foot') => void;
}

const PointList: React.FC<PointListProps> = ({
  points,
  onRemove,
  onReorder,
  onCalculate,
  onAddPoint,
  loading,
  routeInfo,
  profile,
  onProfileChange,
}) => {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = points.findIndex((_, i) => `item-${i}` === active.id);
      const newIndex = points.findIndex((_, i) => `item-${i}` === over?.id);
      onReorder(arrayMove(points, oldIndex, newIndex));
    }
  };

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const coords = await searchAddress(address);
      if (coords) {
        onAddPoint(coords);
        setAddress('');
        setToast({ message: 'Endereço encontrado!', type: 'success' });
      } else {
        setToast({ message: 'Endereço não encontrado', type: 'error' });
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setToast({ message: 'Erro ao buscar endereço', type: 'error' });
    } finally {
      setSearching(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="point-list">
      <h3>📌 Pontos de Entrega</h3>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="search-container">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Digite um endereço..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={searching}>
          {searching ? '🔍' : 'Buscar'}
        </button>
      </div>

      {/* Seletor de perfil */}
      <div className="profile-selector">
        <label>Perfil de viagem:</label>
        <select value={profile} onChange={(e) => onProfileChange(e.target.value as any)}>
          <option value="car">🚗 Carro</option>
          <option value="bike">🚲 Bicicleta</option>
          <option value="foot">🚶 A pé</option>
        </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={points.map((_, i) => `item-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="point-items">
            {points.map((point, index) => (
              <SortableItem
                key={`item-${index}`}
                id={`item-${index}`}
                index={index}
                point={point}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {routeInfo && (
        <div className="route-info">
          <p><strong>Distância:</strong> {routeInfo.distanceKm.toFixed(2)} km</p>
          <p><strong>Tempo estimado:</strong> {routeInfo.durationMin.toFixed(0)} min ({routeInfo.profile})</p>
        </div>
      )}

      <button className="calculate-btn" onClick={onCalculate} disabled={points.length < 2 || loading}>
        {loading ? '🔄 Calculando...' : '🚀 Calcular Rota Otimizada'}
      </button>
    </div>
  );
};

export default PointList;