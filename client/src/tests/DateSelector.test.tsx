import { render, screen } from '@testing-library/react';
import { vi, it, beforeEach, afterEach, expect, describe } from 'vitest';
import userEvent from '@testing-library/user-event';

import DateSelector from '../components/DateSelector';

beforeEach(() => { 
    vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => ({ dates: [] }),
    })))
});

afterEach(() => { 
    vi.unstubAllGlobals();
})

const renderDateSelector = () => { 
    render(<DateSelector />);
}

describe('DateSelector', () => {
    it('changes lists for different dates', async () => {
        const user = userEvent.setup();

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const currentDate = `${year}-${month}-${day}`;
        const nextDate = `${year}-${month}-${String(today.getDate() + 1).padStart(2, '0')}`;

        renderDateSelector();

        // Add an item through Accordian's form
        await user.type(screen.getByLabelText('Title'), 'Milk');
        await user.type(screen.getByLabelText('Content'), 'Buy 2%');
        await user.click(screen.getByRole('button', { name: 'Add Item' }));

        expect(await screen.findByText('Milk')).toBeInTheDocument();
        expect(screen.getByLabelText('Date')).toHaveValue(currentDate);

        await user.click(screen.getByLabelText('Increase-Date'));

        expect(screen.queryByText('Milk')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Date')).toHaveValue(nextDate);

        await user.click(screen.getByLabelText('Decrease-Date'));

        expect(await screen.findByText('Milk')).toBeInTheDocument();
        expect(screen.getByLabelText('Date')).toHaveValue(currentDate);


    });
});