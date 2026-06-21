// for the drag and drop feature
export const DropPosition = {
    ABOVE: 'ABOVE',
    BELOW: 'BELOW',
} as const;

export type DropPosition = (typeof DropPosition)[keyof typeof DropPosition];