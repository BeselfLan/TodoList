import './App.css'
import DateSelector from './components/DateSelector'

function App() {

  return (
    <div className='flex justify-center items-center flex-col gap-2'>
      <h1 className='bold text-3xl text-center m-5'>THE TODOLIST</h1>
      <DateSelector />
    </div>
  )
}

export default App
