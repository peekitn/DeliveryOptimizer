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
  routeInfo: { distanceKm: number; durationMin: number } | null;
}

const PointList: React.FC<PointListProps> = ({
  points,
  onRemove,
  onReorder,
  onCalculate,
  onAddPoint,
  loading,
  routeInfo,
}) => {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);

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
        onAddPoint(coords); // [lng, lat]
        setAddress('');
      } else {
        alert('Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar endereço');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="point-list">
      <h3>📌 Pontos de Entrega</h3>

      {/* Campo de busca de endereço */}
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

      {/* Informações da rota */}
      {routeInfo && (
        <div className="route-info">
          <p><strong>Distância:</strong> {routeInfo.distanceKm.toFixed(2)} km</p>
          <p><strong>Tempo estimado:</strong> {routeInfo.durationMin.toFixed(0)} min</p>
        </div>
      )}

      <button className="calculate-btn" onClick={onCalculate} disabled={points.length < 2 || loading}>
        {loading ? '🔄 Calculando...' : '🚀 Calcular Rota Otimizada'}
      </button>
    </div>
  );
};

export default PointList;