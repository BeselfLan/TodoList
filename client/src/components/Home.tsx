import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  console.log('attempting to log in with google');
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenResponse.access_token }),
      });

      const data = await res.json();
      console.log('server response:', data);

      if (res.ok && data.ok) {
        localStorage.setItem('todoUserId', data.userId);
        navigate('/list');
      }
    },
    onError: () => {
      console.error('Google login failed');
    },
  });



  return (
    <main className='flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-16 text-white'>
      <div className='w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-sm'>
        <p className='mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-pink-200'>Plan your day</p>
        <h1 className='mb-4 text-4xl font-bold sm:text-6xl'>Welcome to your TodoList</h1>
        <p className='mx-auto mb-8 max-w-2xl text-lg text-slate-200'>Stay organized, track your priorities, and keep every task in one place.</p>
        <button
          onClick={() => login()}
          className='inline-flex rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-300'
        >
          Login with Google
        </button>
      </div>
    </main>
  );
}

export default Home;
