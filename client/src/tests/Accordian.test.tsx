import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Accordian from '../components/Accordian';
import type { AccordianItem } from '../components/types';

const items: AccordianItem[] = [
    { id: 1, title: 'Milk', content: 'Buy 2% milk', completed: false },
    { id: 2, title: 'Taxes', content: 'File before April', completed: true },
];

// Every callback is a spy, so each test can assert on the one it cares about
// without the others throwing for being undefined. Overrides let a test swap
// in different items.
const renderAccordian = (overrides: Partial<React.ComponentProps<typeof Accordian>> = {}) => {
    const props = {
        items,
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onToggle: vi.fn(),
        onMove: vi.fn(),
        ...overrides,
    };

    render(<Accordian {...props} />);
    return props;
};

describe('Accordian', () => {
    it('renders a card for every item', () => {
        renderAccordian();

        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Taxes')).toBeInTheDocument();
    });

    it('hides item content until the card is clicked', async () => {
        const user = userEvent.setup();
        renderAccordian();

        expect(screen.queryByText('Buy 2% milk')).not.toBeInTheDocument();

        await user.click(screen.getByText('Milk'));

        expect(screen.getByText('Buy 2% milk')).toBeInTheDocument();
    });

    it('reflects the completed flag on each checkbox', () => {
        renderAccordian();

        const [milk, taxes] = screen.getAllByRole('checkbox');
        expect(milk).not.toBeChecked();
        expect(taxes).toBeChecked();
    });

    it('calls onToggle with the id of the ticked item', async () => {
        const user = userEvent.setup();
        const { onToggle } = renderAccordian();

        await user.click(screen.getAllByRole('checkbox')[1]);

        expect(onToggle).toHaveBeenCalledWith(2);
    });

    it('calls onRemove with the id of the removed item', async () => {
        const user = userEvent.setup();
        const { onRemove } = renderAccordian();

        await user.click(screen.getAllByRole('button', { name: 'X' })[0]);

        expect(onRemove).toHaveBeenCalledWith(1);
    });

    it('submits a trimmed new item and clears the form', async () => {
        const user = userEvent.setup();
        const { onAdd } = renderAccordian();

        const title = screen.getByLabelText('Title');
        const content = screen.getByLabelText('Content');

        await user.type(title, '  Walk the dog  ');
        await user.type(content, '  Twice today  ');
        await user.click(screen.getByRole('button', { name: 'Add Item' }));

        expect(onAdd).toHaveBeenCalledWith({ title: 'Walk the dog', content: 'Twice today' });
        expect(title).toHaveValue('');
        expect(content).toHaveValue('');
    });

    it('ignores a submit when a field is only whitespace', async () => {
        const user = userEvent.setup();
        const { onAdd } = renderAccordian();

        await user.type(screen.getByLabelText('Title'), 'Walk the dog');
        await user.type(screen.getByLabelText('Content'), '   ');
        await user.click(screen.getByRole('button', { name: 'Add Item' }));

        expect(onAdd).not.toHaveBeenCalled();
    });
});
