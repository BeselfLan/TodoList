import type { DragEvent } from 'react';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// for the drag and drop feature
export const DropPosition = {
    ABOVE: 'ABOVE',
    BELOW: 'BELOW',
} as const;

export type DropPosition = (typeof DropPosition)[keyof typeof DropPosition];

// Accordian types

export type AccordianItem = { id: number; title: string; content: string; completed: boolean };

// What the add form supplies; the id and the ticked state are filled in for it.
export type NewAccordianItem = Omit<AccordianItem, 'id' | 'completed'>;


export type AccordianAddButtonProps = {
  onAdd: (item: NewAccordianItem) => void;
};

export type AccordianProps = {
    items: AccordianItem[];
    onAdd: (item: NewAccordianItem) => void;
    onRemove: (id: number) => void;
    onToggle: (id: number) => void;
    onMove: (sourceId: number, targetId: number, position: DropPosition | null) => void;
}

export type AccordianCardProps = {
    id: number;
    title: string;
    content: string;
    completed: boolean;
    onRemove: (id: number) => void;
    onToggle: (id: number) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, id: number) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>, id: number) => void;
    onDrop: (event: DragEvent<HTMLDivElement>, targetId: number) => void;
    onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
    dropHint: DropPosition | null;
};