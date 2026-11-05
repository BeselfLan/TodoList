import './App.css'
import type { ReactNode } from 'react'
import DateSelector from './components/DateSelector'
import Home from './components/Home'
import ThemeToggle from './components/ThemeToggle'
import { createBrowserRouter, RouterProvider, useNavigate, Navigate } from 'react-router-dom'

const TodoList = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('todoToken');
    localStorage.removeItem('todoUserId');
    navigate('/');
  };

  return (
    <div className='relative min-h-dvh'>
      <div className='absolute top-3 right-3 z-10 flex items-center gap-1 text-carbon lg:top-4 lg:right-6 lg:text-ink'>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className='rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-carbon/10 lg:hover:bg-wash'
          aria-label='Logout-Button'
        >
          Log out
        </button>
      </div>
      <DateSelector />
    </div>
  );
};

const LogIn = () => (
  <div>
    LOG IN
  </div>
);

// RequireAuth: redirect to the home page when there is no session token
function RequireAuth({ children }: { children: ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('todoToken') : null;
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export const routes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <LogIn />
  },
  {
    path: '/list',
    element: (
      <RequireAuth>
        <TodoList />
      </RequireAuth>
    ),
  },
];

const router = createBrowserRouter(routes);


function App() {

  return <RouterProvider router={router} />;
}

export default App
