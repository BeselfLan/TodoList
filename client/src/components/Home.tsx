import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import DayHero from './DayHero';
import { GoogleIcon } from './Icons';
import { API_URL } from './types';

function Home() {
  const navigate = useNavigate();
  console.log('attempting to log in with google');
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenResponse.access_token }),
      });

      const data = await res.json();
      console.log('Login reached server');
      console.log('server response:', data);

      if (res.ok && data.ok) {
        localStorage.setItem('todoToken', data.token);
        localStorage.setItem('todoUserId', data.userId);
        navigate('/list');
      }
    },
    onError: () => {
      console.error('Google login failed');
    },
  });



  return (
    <main className='flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(22rem,30rem)_minmax(0,1fr)]'>
      <aside className='tear-edge flex flex-col gap-10 bg-marigold px-6 pt-6 pb-10 text-carbon lg:sticky lg:top-0 lg:h-dvh lg:justify-between lg:px-10 lg:py-8'>
        <p className='font-display text-sm font-extrabold tracking-[0.2em]'>THE TODOLIST</p>
        <DayHero date={new Date()} />
      </aside>
      <section className='flex flex-1 flex-col justify-center px-6 py-14 lg:px-20'>
        <div className='max-w-xl'>
          <p className='mb-4 text-sm font-semibold tracking-wide text-muted'>Plan your day</p>
          <h1 className='mb-5 font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-7xl'>Every day gets its own page.</h1>
          <p className='mb-9 max-w-md text-lg text-pretty text-muted'>Write down what the day needs, tick it off as you go, and drag the rest into order.</p>
          <button
            onClick={() => login()}
            className='inline-flex items-center gap-3 rounded-md bg-ink px-6 py-3.5 font-semibold text-paper transition hover:opacity-85'
          >
            <span className='grid size-6 place-items-center rounded-sm bg-white'>
              <GoogleIcon className='size-4' />
            </span>
            Login with Google
          </button>
        </div>
      </section>
    </main>
  );
}

export default Home;
