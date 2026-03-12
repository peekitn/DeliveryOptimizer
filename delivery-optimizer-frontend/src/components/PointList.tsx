import React from 'react';
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
import './PointList.css';

interface PointListProps {
  points: [number, number][];
  onRemove: (index: number) => void;
  onReorder: (newPoints: [number, number][]) => void;
  onCalculate: () => void;
  loading: boolean;
}

const PointList: React.FC<PointListProps> = ({
  points,
  onRemove,
  onReorder,
  onCalculate,
  loading,
}) => {
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

  return (
    <div className="point-list">
      <h3>📌 Pontos de Entrega</h3>
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
      <button className="calculate-btn" onClick={onCalculate} disabled={points.length < 2 || loading}>
        {loading ? '🔄 Calculando...' : '🚀 Calcular Rota Otimizada'}
      </button>
    </div>
  );
};

export default PointList;