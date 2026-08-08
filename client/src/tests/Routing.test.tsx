import { render, screen } from '@testing-library/react';
import { it, describe, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import userEvent from '@testing-library/user-event';

import { routes } from '../App';
import { expect } from 'vitest';

beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => ({
        ok: true,
        json: async () => ({ dates: [] }),
    })));
});
afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

const renderRoutes = ( router: ReturnType<typeof createMemoryRouter> ) => {
    render(
        <GoogleOAuthProvider clientId="test">
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    );
}

describe('Routing', () => {
    it('starts user with no route extension', () => {
        const router = createMemoryRouter(routes);
        renderRoutes(router);

        expect(router.state.location.pathname).toBe('/');
    });
    it('does not grant unauthorized access to list redirection', () => {
        const router = createMemoryRouter(routes, { initialEntries: ['/list'] });
        renderRoutes(router);

        expect(router.state.location.pathname).toBe('/');
    });
    it('grants authorized access to list route', async () => {
        localStorage.setItem('todoToken', 'a-token');

        const router = createMemoryRouter(routes, { initialEntries: ['/list'] });
        renderRoutes(router);
        
        expect(await screen.queryByRole('heading', { name: 'THE TODOLIST' })).toBeInTheDocument();
        expect(router.state.location.pathname).toBe('/list');
    });
    it('redirects to homepage after loging out', async () => {
        localStorage.setItem('todoToken', 'a-token');

        const user = userEvent.setup();

        const router = createMemoryRouter(routes, { initialEntries: ['/list'] });
        renderRoutes(router);

        await user.click(screen.getByLabelText('Logout-Button'));

        expect(router.state.location.pathname).toBe('/');
    })
});