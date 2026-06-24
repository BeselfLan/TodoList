import type { DragEvent } from 'react';

// for the drag and drop feature
export const DropPosition = {
    ABOVE: 'ABOVE',
    BELOW: 'BELOW',
} as const;

export type DropPosition = (typeof DropPosition)[keyof typeof DropPosition];

// Accordian types

export type AccordianItem = { id: number; title: string; content: string };


export type AccordianAddButtonProps = {
  onAdd: (item: Omit<AccordianItem, 'id'>) => void;
};

export type AccordianProps = {
    items: AccordianItem[];
    onAdd: (item: Omit<AccordianItem, 'id'>) => void;
    onRemove: (id: number) => void;
    onMove: (sourceId: number, targetId: number, position: DropPosition | null) => void;
}

export type AccordianCardProps = { 
    id: number; 
    title: string; 
    content: string; 
    onRemove: (id: number) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, id: number) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>, id: number) => void;
    onDrop: (event: DragEvent<HTMLDivElement>, targetId: number) => void;
    onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
    dropHint: DropPosition | null;
};