import { fireEvent, render, screen } from '@testing-library/react';
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
    vi.unstubAllEnvs();
    vi.useRealTimers();
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

    describe('at 8pm on Nov 5 in New York', () => {
        beforeEach(() => {
            // An evening here is already tomorrow in UTC. These tests depend on
            // that gap; run in UTC they would pass even with the bugs.
            vi.stubEnv('TZ', 'America/New_York');
            // Only Date: faking the timers too would hang userEvent
            vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-06T01:00:00Z') });
        });

        it('shows the local date, matching the list on screen', () => {
            renderDateSelector();

            expect(screen.getByLabelText('Date')).toHaveValue('2026-11-05');
            expect(screen.getByRole('heading', { name: "Today's list" })).toBeInTheDocument();
        });

        it('lands on the day picked in the date field', () => {
            renderDateSelector();

            fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-20' } });

            expect(screen.getByLabelText('Date')).toHaveValue('2026-11-20');
            expect(screen.getByText('Friday')).toBeInTheDocument();
        });

        it('keeps the current date when the date field is cleared', () => {
            renderDateSelector();

            fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });

            expect(screen.getByLabelText('Date')).toHaveValue('2026-11-05');
        });

        it('selects a day from the week strip and returns with Today', async () => {
            const user = userEvent.setup();
            renderDateSelector();

            expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();

            await user.click(screen.getByRole('button', { name: 'Tuesday, November 3' }));

            expect(screen.getByLabelText('Date')).toHaveValue('2026-11-03');
            expect(screen.getByRole('heading', { name: "Tuesday's list" })).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Today' }));

            expect(screen.getByLabelText('Date')).toHaveValue('2026-11-05');
        });

        it('counts the finished items for the day', async () => {
            const user = userEvent.setup();
            renderDateSelector();

            await user.type(screen.getByLabelText('Title'), 'Milk');
            await user.type(screen.getByLabelText('Content'), 'Buy 2%');
            await user.click(screen.getByRole('button', { name: 'Add Item' }));

            expect(await screen.findByText('0 of 1 done')).toBeInTheDocument();

            await user.click(screen.getByRole('checkbox'));

            expect(await screen.findByText('All done')).toBeInTheDocument();
        });
    });
});
