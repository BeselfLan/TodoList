import './App.css'
import DateSelector from './components/DateSelector'
import  { createBrowserRouter, RouterProvider } from 'react-router-dom'

const Home = () => (
  <div>
    THe Home
    LOG IN
  </div>
);

const TodoList = () => (
  <div className='flex justify-center items-center flex-col gap-2'>
    <h1 className='bold text-3xl text-center m-5'>THE TODOLIST</h1>
    <DateSelector />
  </div>
);

const LogIn = () => (
  <div>
    LOG IN
  </div>
);

const router = createBrowserRouter([
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
    element: <TodoList />,
  },
]);


function App() {

  return <RouterProvider router={router} />;
}

export default App
