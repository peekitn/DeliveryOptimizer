import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  index: number;
  point: [number, number];
  onRemove: (index: number) => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  index,
  point,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`point-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <span className="point-index">{index + 1}</span>
        <span className="point-coords">
          {point[1].toFixed(4)}, {point[0].toFixed(4)}
        </span>
      </div>
      <button className="remove-btn" onClick={() => onRemove(index)}>
        🗑️
      </button>
    </div>
  );
};