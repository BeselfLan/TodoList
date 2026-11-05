import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';

import ThemeToggle from '../components/ThemeToggle';

afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
    it('switches theme and remembers the choice', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(localStorage.getItem('todoTheme')).toBe('dark');

        await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.getItem('todoTheme')).toBe('light');
    });

    it('starts from the theme already on the page', () => {
        document.documentElement.dataset.theme = 'dark';
        render(<ThemeToggle />);

        expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    });
});
