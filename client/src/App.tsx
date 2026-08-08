import './App.css'
import type { ReactNode } from 'react'
import DateSelector from './components/DateSelector'
import Home from './components/Home'
import { createBrowserRouter, RouterProvider, useNavigate, Navigate } from 'react-router-dom'

const TodoList = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('todoToken');
    localStorage.removeItem('todoUserId');
    navigate('/');
  };

  return (
    <div className='flex justify-center items-center flex-col gap-2'>
      <div className='flex w-full max-w-4xl justify-end px-4 pt-4'>
        <button
          onClick={handleLogout}
          className='rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700'
          aria-label='Logout-Button'
        >
          Log out
        </button>
      </div>
      <h1 className='bold text-3xl text-center m-5'>THE TODOLIST</h1>
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
